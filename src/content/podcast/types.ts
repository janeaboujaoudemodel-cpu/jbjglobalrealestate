export type PodcastSpeaker = "jane" | "alex" | "lina";

export type PodcastSegment = {
  speaker: PodcastSpeaker;
  text: string;
};

export type PodcastEpisode = {
  id: number;
  title: string;
  characters: string[];
  /** Display duration label (mm:ss) used as fallback if audio metadata is missing. */
  duration: string;
  /** Full-bleed image shown in the player card + episode list. */
  thumbnail: string;
  /** Script segments for voice stitching (only when episode is ready). */
  segments?: PodcastSegment[];
};
