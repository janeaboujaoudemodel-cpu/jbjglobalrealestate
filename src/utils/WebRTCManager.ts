import { supabase } from "@/integrations/supabase/client";

export interface Participant {
  oderId: string;
  odername: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
}

export class WebRTCManager {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private channel: any = null;
  private roomId: string;
  private oderId: string;
  private odername: string;
  private onParticipantJoin: (participant: Participant) => void;
  private onParticipantLeave: (oderId: string) => void;
  private onRemoteStream: (oderId: string, stream: MediaStream) => void;

  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  };

  constructor(
    roomId: string,
    oderId: string,
    odername: string,
    onParticipantJoin: (participant: Participant) => void,
    onParticipantLeave: (oderId: string) => void,
    onRemoteStream: (oderId: string, stream: MediaStream) => void
  ) {
    this.roomId = roomId;
    this.oderId = oderId;
    this.odername = odername;
    this.onParticipantJoin = onParticipantJoin;
    this.onParticipantLeave = onParticipantLeave;
    this.onRemoteStream = onRemoteStream;
  }

  async initialize(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false,
        audio: audioEnabled ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });

      await this.setupSignaling();
      return this.localStream;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      throw error;
    }
  }

  private async setupSignaling() {
    this.channel = supabase.channel(`meeting:${this.roomId}`, {
      config: {
        presence: { key: this.oderId },
        broadcast: { self: false }
      }
    });

    // Handle presence for participant tracking
    this.channel.on('presence', { event: 'sync' }, () => {
      const state = this.channel.presenceState();
      console.log('Presence sync:', state);
    });

    this.channel.on('presence', { event: 'join' }, async ({ key, newPresences }: any) => {
      console.log('Participant joined:', key, newPresences);
      if (key !== this.oderId && newPresences.length > 0) {
        const presence = newPresences[0];
        this.onParticipantJoin({
          oderId: key,
          odername: presence.odername || 'Guest'
        });
        // Initiate connection as the existing peer
        await this.createPeerConnection(key, true);
      }
    });

    this.channel.on('presence', { event: 'leave' }, ({ key }: any) => {
      console.log('Participant left:', key);
      this.closePeerConnection(key);
      this.onParticipantLeave(key);
    });

    // Handle WebRTC signaling messages
    this.channel.on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
      console.log('Received offer from:', payload.from);
      if (payload.to === this.oderId) {
        await this.handleOffer(payload.from, payload.offer);
      }
    });

    this.channel.on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
      console.log('Received answer from:', payload.from);
      if (payload.to === this.oderId) {
        await this.handleAnswer(payload.from, payload.answer);
      }
    });

    this.channel.on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
      console.log('Received ICE candidate from:', payload.from);
      if (payload.to === this.oderId) {
        await this.handleIceCandidate(payload.from, payload.candidate);
      }
    });

    await this.channel.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') {
        await this.channel.track({
          oderId: this.oderId,
          odername: this.odername,
          online_at: new Date().toISOString()
        });
        console.log('Joined meeting room:', this.roomId);
      }
    });
  }

  private async createPeerConnection(remoteoderId: string, initiator: boolean): Promise<RTCPeerConnection> {
    console.log(`Creating peer connection with ${remoteoderId}, initiator: ${initiator}`);
    
    const pc = new RTCPeerConnection(this.rtcConfig);
    this.peerConnections.set(remoteoderId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate to:', remoteoderId);
        this.channel.send({
          type: 'broadcast',
          event: 'ice-candidate',
          payload: {
            from: this.oderId,
            to: remoteoderId,
            candidate: event.candidate
          }
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from:', remoteoderId);
      if (event.streams[0]) {
        this.onRemoteStream(remoteoderId, event.streams[0]);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteoderId}:`, pc.connectionState);
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this.closePeerConnection(remoteoderId);
      }
    };

    // Create and send offer if initiator
    if (initiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      this.channel.send({
        type: 'broadcast',
        event: 'offer',
        payload: {
          from: this.oderId,
          to: remoteoderId,
          offer: pc.localDescription
        }
      });
    }

    return pc;
  }

  private async handleOffer(fromId: string, offer: RTCSessionDescriptionInit) {
    let pc = this.peerConnections.get(fromId);
    if (!pc) {
      pc = await this.createPeerConnection(fromId, false);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.channel.send({
      type: 'broadcast',
      event: 'answer',
      payload: {
        from: this.oderId,
        to: fromId,
        answer: pc.localDescription
      }
    });
  }

  private async handleAnswer(fromId: string, answer: RTCSessionDescriptionInit) {
    const pc = this.peerConnections.get(fromId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  private async handleIceCandidate(fromId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peerConnections.get(fromId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  private closePeerConnection(oderId: string) {
    const pc = this.peerConnections.get(oderId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(oderId);
    }
  }

  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  async shareScreen(): Promise<MediaStream | null> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      // Replace video track in all peer connections
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      // Handle screen share stop
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

      return screenStream;
    } catch (error) {
      console.error('Error sharing screen:', error);
      return null;
    }
  }

  stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        this.peerConnections.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });
      }
    }
  }

  disconnect() {
    // Close all peer connections
    this.peerConnections.forEach((pc, oderId) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Unsubscribe from channel
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    console.log('Disconnected from meeting');
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }
}
