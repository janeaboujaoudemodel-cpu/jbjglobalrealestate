import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mic, Upload, Play, Pause, Square, Download, Trash2, Loader2,
  Volume2, Wand2, AlertTriangle, FileAudio, Video, Check,
} from "lucide-react";
import useVoiceStudio from "./useVoiceStudio";
import { VOICE_LIBRARY, MAX_SCRIPT_LENGTH, TONE_OPTIONS } from "./voiceStudioTypes";

export default function VoiceStudio() {
  const vs = useVoiceStudio();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Hidden audio elements */}
      <audio ref={vs.audioRef} onEnded={() => vs.setIsPlaying(false)} onPause={() => vs.setIsPlaying(false)} />
      <audio ref={vs.previewAudioRef} onEnded={() => vs.setIsPreviewPlaying(false)} onPause={() => vs.setIsPreviewPlaying(false)} />

      {/* Hidden file inputs */}
      <input ref={vs.fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => vs.handleAudioUpload(e.target.files)} />
      <input ref={vs.videoInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => vs.handleVideoUpload(e.target.files)} />

      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-[#B8860B]/20 border border-[#D4AF37]/30">
                <Mic className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Voice Studio
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">FREE</Badge>
                </h1>
                <p className="text-slate-400 text-sm">Record → Multi-Voice Narration</p>
              </div>
            </div>
            <Link
              to="/toolkit/voice-studio-pro"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/20 to-fuchsia-600/10 border border-purple-500/40 text-purple-300 hover:border-purple-400 hover:text-purple-200 transition-all text-sm font-medium"
            >
              <Wand2 className="h-4 w-4" />
              Try Voice Studio Pro
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px] ml-1">CLONE · 16 LANGS</Badge>
            </Link>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-6">
            {/* Step 1: Audio Input */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">1</span>
                  Audio Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={vs.isRecording ? vs.stopRecording : vs.startRecording}
                    variant={vs.isRecording ? "destructive" : "default"}
                    className={vs.isRecording ? "" : "bg-[#D4AF37] hover:bg-[#B8860B] text-black"}
                  >
                    {vs.isRecording ? (
                      <><Square className="h-4 w-4 mr-2" />Stop ({vs.formatTime(vs.recordingTime)})</>
                    ) : (
                      <><Mic className="h-4 w-4 mr-2" />Record Voice</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => vs.fileInputRef.current?.click()} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    <Upload className="h-4 w-4 mr-2" />Upload Audio
                  </Button>
                </div>

                {vs.isRecording && (
                  <div className="flex items-center gap-2 text-red-400">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm">Recording... (max 60 seconds)</span>
                  </div>
                )}

                {vs.hasAudioSample && !vs.isRecording && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                    <FileAudio className="h-5 w-5 text-[#D4AF37]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {vs.uploadedAudio?.name || `Recording (${vs.formatTime(vs.recordedAudio?.duration || 0)})`}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={vs.playPreview} className="text-slate-400 hover:text-white">
                      {vs.isPreviewPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={vs.clearAudio} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <p className="text-xs text-slate-500">Record or upload a voice sample for cloning, or skip for library voices.</p>
              </CardContent>
            </Card>

            {/* Step 2: Script */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">2</span>
                  Script
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Enter your narration script here..."
                  value={vs.script}
                  onChange={(e) => vs.updateScript(e.target.value)}
                  className="min-h-[150px] bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{vs.script.length.toLocaleString()} / {MAX_SCRIPT_LENGTH.toLocaleString()} characters</span>
                  <span className={vs.script.length > MAX_SCRIPT_LENGTH * 0.9 ? "text-amber-400" : ""}>
                    {vs.script.length >= MAX_SCRIPT_LENGTH ? "Limit reached" : ""}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Tone & Style */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">
                    <Wand2 className="w-3 h-3" />
                  </span>
                  Tone & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => vs.toast({ title: `Tone: ${tone.label}`, description: "Adjust your script to match this style for best results." })}
                      className="p-2.5 rounded-lg border border-slate-700 bg-slate-800/30 hover:border-[#D4AF37]/50 hover:bg-[#D4AF37]/5 transition-all text-left"
                    >
                      <span className="text-lg">{tone.icon}</span>
                      <p className="text-xs text-white font-medium mt-1">{tone.label}</p>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">Select a tone to guide your script. The voice engine will read your text as-written — use punctuation and pacing to control delivery.</p>
              </CardContent>
            </Card>

            {/* Step 3: Voice Selection */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">3</span>
                  Voice Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={vs.voiceMode} onValueChange={(v) => vs.setVoiceMode(v as "library" | "enhance" | "clone")}>
                  <TabsList className="grid w-full grid-cols-3 bg-slate-800/50">
                    <TabsTrigger value="library" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">Voice Library</TabsTrigger>
                    <TabsTrigger value="enhance" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">Enhance</TabsTrigger>
                    <TabsTrigger value="clone" className="data-[state=active]:bg-[#D4AF37] data-[state=active]:text-black">My Voice</TabsTrigger>
                  </TabsList>

                  <TabsContent value="library" className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      {VOICE_LIBRARY.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => vs.setSelectedVoice(voice.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            vs.selectedVoice === voice.id
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Volume2 className={`h-4 w-4 ${vs.selectedVoice === voice.id ? "text-[#D4AF37]" : "text-slate-500"}`} />
                            <span className="text-white font-medium text-sm">{voice.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{voice.gender}</Badge>
                            <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">{voice.accent}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{voice.description}</p>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="enhance" className="mt-4 space-y-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                      <Wand2 className="h-5 w-5 text-[#D4AF37] mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium">Voice Enhancement</h4>
                        <p className="text-sm text-slate-400 mt-1">
                          Clean up your recorded audio by removing background noise and enhancing clarity.
                          The enhanced audio will be used with a library voice for narration.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {VOICE_LIBRARY.slice(0, 4).map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => vs.setSelectedVoice(voice.id)}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            vs.selectedVoice === voice.id
                              ? "border-[#D4AF37] bg-[#D4AF37]/10"
                              : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                          }`}
                        >
                          <span className="text-white text-sm">{voice.name}</span>
                          <span className="text-slate-500 text-xs ml-2">({voice.accent})</span>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="clone" className="mt-4 space-y-4">
                    <Alert className="bg-amber-950/30 border-amber-600/50">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <AlertDescription className="text-amber-200 text-sm">
                        <strong>Voice Cloning Policy:</strong> You may only clone your own voice.
                        Cloning someone else's voice without consent is prohibited and may result in account suspension.
                      </AlertDescription>
                    </Alert>

                    {!vs.hasAudioSample ? (
                      <div className="p-6 rounded-lg border-2 border-dashed border-slate-700 text-center">
                        <Mic className="h-8 w-8 text-slate-500 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">Record or upload a voice sample above to enable voice cloning.</p>
                        <p className="text-slate-500 text-xs mt-2">Recommended: 30+ seconds of clear speech</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-700/50">
                          <Check className="h-4 w-4 text-emerald-400" />
                          <span className="text-emerald-300 text-sm">Voice sample ready for cloning</span>
                        </div>
                        <div className="flex items-start space-x-3 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                          <Checkbox
                            id="consent"
                            checked={vs.cloneConsent}
                            onCheckedChange={(checked) => vs.setCloneConsent(checked === true)}
                            className="mt-1 border-slate-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                          />
                          <div className="space-y-1">
                            <Label htmlFor="consent" className="text-white text-sm font-medium cursor-pointer">
                              I confirm I am the legal owner of this voice
                            </Label>
                            <p className="text-xs text-slate-400">
                              By checking this box, you certify that you have the legal right to clone this voice and that you will not use it to impersonate others.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            {/* Step 4: Output Options */}
            <Card className="bg-slate-900/50 border-slate-700/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold">4</span>
                  Output Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300 text-sm mb-3 block">Audio Format</Label>
                  <RadioGroup value={vs.outputFormat} onValueChange={(v) => vs.setOutputFormat(v as "mp3" | "wav")} className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mp3" id="mp3" className="border-slate-500 text-[#D4AF37]" />
                      <Label htmlFor="mp3" className="text-slate-300 cursor-pointer">MP3 (Smaller)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wav" id="wav" className="border-slate-500 text-[#D4AF37]" />
                      <Label htmlFor="wav" className="text-slate-300 cursor-pointer">WAV (Higher Quality)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-2 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="overlay"
                        checked={vs.includeOverlay}
                        onCheckedChange={(checked) => vs.setIncludeOverlay(checked === true)}
                        className="border-slate-500 data-[state=checked]:bg-[#D4AF37] data-[state=checked]:border-[#D4AF37]"
                      />
                      <Label htmlFor="overlay" className="text-slate-300 text-sm cursor-pointer">Overlay onto video</Label>
                    </div>
                    {vs.includeOverlay && (
                      <Button variant="outline" size="sm" onClick={() => vs.videoInputRef.current?.click()} className="border-slate-600 text-slate-300 hover:bg-slate-800">
                        <Video className="h-4 w-4 mr-2" />
                        {vs.videoFile ? "Change Video" : "Upload Video"}
                      </Button>
                    )}
                  </div>
                  {vs.videoFile && vs.includeOverlay && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                      <Video className="h-4 w-4" />
                      <span className="truncate">{vs.videoFile.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => vs.setVideoFile(null)} className="text-slate-500 hover:text-red-400 p-1 h-auto">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {vs.includeOverlay && (
                    <p className="text-xs text-slate-500 mt-2">Note: Video overlay creates separate audio + video files for manual merging.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <Button
              onClick={vs.generateNarration}
              disabled={vs.processing || !vs.script.trim() || (vs.voiceMode === "clone" && !vs.cloneConsent)}
              className="w-full h-14 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#8B6914] text-black font-semibold text-lg disabled:opacity-50"
            >
              {vs.processing ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{vs.progressText}</>
              ) : (
                <><Wand2 className="h-5 w-5 mr-2" />Generate Narration</>
              )}
            </Button>

            {vs.processing && <Progress value={vs.progress} className="h-2 bg-slate-800" />}

            {/* Generated Audio */}
            {vs.generatedAudio && !vs.processing && (
              <Card className="bg-gradient-to-br from-emerald-950/40 to-slate-900/50 border-emerald-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-emerald-400 flex items-center gap-2 text-lg">
                    <Check className="h-5 w-5" />Narration Ready!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Button onClick={vs.playGenerated} variant="outline" className="border-emerald-600 text-emerald-400 hover:bg-emerald-950/50">
                      {vs.isPlaying ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Preview</>}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button onClick={vs.downloadAudio} className="bg-[#D4AF37] hover:bg-[#B8860B] text-black">
                      <Download className="h-4 w-4 mr-2" />Download Script
                    </Button>
                  </div>

                  {vs.videoFile && vs.includeOverlay && (
                    <div className="pt-3 border-t border-slate-700">
                      <p className="text-slate-400 text-sm mb-2">Video Overlay Instructions:</p>
                      <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                        <li>Download your narration audio above</li>
                        <li>Use a free tool like Kapwing, CapCut, or iMovie</li>
                        <li>Import your video and the narration audio</li>
                        <li>Align the audio track and export</li>
                      </ol>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Fair Usage Notice */}
            <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <h4 className="text-slate-300 text-sm font-medium mb-2">Fair Usage Policy</h4>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Maximum 5,000 characters per generation</li>
                <li>• Recording limit: 60 seconds per sample</li>
                <li>• Voice cloning for personal use only</li>
                <li>• No impersonation or deceptive use</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
