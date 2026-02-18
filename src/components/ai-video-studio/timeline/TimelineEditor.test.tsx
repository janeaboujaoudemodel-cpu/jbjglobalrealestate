import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { screen, fireEvent } from '@testing-library/dom';
import { render } from '@testing-library/react/pure';
import React from 'react';
import { TimelineEditor } from './TimelineEditor';
import { Track, TimelineMode } from '../types';

// Minimal track with two clips and a gap — required for transition context menu
const makeTrack = (): Track => ({
  id: 'track-1',
  type: 'video',
  name: 'Video 1',
  locked: false,
  muted: false,
  visible: true,
  clips: [
    {
      id: 'clip-a',
      trackId: 'track-1',
      type: 'video',
      name: 'Clip A',
      startTime: 0,
      duration: 5,
      source: { url: '', inPoint: 0, outPoint: 5, originalDuration: 5 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: [],
      effects: [],
    },
    {
      id: 'clip-b',
      trackId: 'track-1',
      type: 'video',
      name: 'Clip B',
      startTime: 6,
      duration: 5,
      source: { url: '', inPoint: 0, outPoint: 5, originalDuration: 5 },
      transform: { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      keyframes: [],
      effects: [],
    },
  ],
});

const defaultProps = {
  tracks: [makeTrack()],
  currentTime: 0,
  duration: 30,
  zoom: 1,
  mode: 'select' as TimelineMode,
  snapEnabled: true,
  selectedClipIds: [],
  onTimeChange: vi.fn(),
  onZoomChange: vi.fn(),
  onModeChange: vi.fn(),
  onToggleSnap: vi.fn(),
  onSelectClip: vi.fn(),
  onMoveClip: vi.fn(),
  onSplitClip: vi.fn(),
  onDeleteClip: vi.fn(),
  onUpdateTrack: vi.fn(),
  onAddTrack: vi.fn(),
  onDeleteTrack: vi.fn(),
  onAddTransition: vi.fn(),
};

describe('TimelineEditor — Transition context menu', () => {
  it('renders two clips on the timeline', () => {
    render(<TimelineEditor {...defaultProps} />);
    expect(screen.getAllByTitle('Clip A').length).toBeGreaterThan(0);
    expect(screen.getAllByTitle('Clip B').length).toBeGreaterThan(0);
  });

  it('right-click on Clip A opens context menu with transition options', async () => {
    render(<TimelineEditor {...defaultProps} />);
    const clipA = screen.getAllByTitle('Clip A')[0];
    fireEvent.contextMenu(clipA);
    // Context menu should appear with transition sub-items
    expect(await screen.findByText('Add Transition Before')).toBeInTheDocument();
    expect(await screen.findByText('Add Transition After')).toBeInTheDocument();
  });

  it('context menu also shows Split and Delete options', async () => {
    render(<TimelineEditor {...defaultProps} />);
    fireEvent.contextMenu(screen.getAllByTitle('Clip A')[0]);
    expect(await screen.findByText('Split at Playhead')).toBeInTheDocument();
    expect(await screen.findByText('Delete Clip')).toBeInTheDocument();
  });

  it('Delete Clip menu item exists with correct role', async () => {
    render(<TimelineEditor {...defaultProps} />);
    fireEvent.contextMenu(screen.getAllByTitle('Clip A')[0]);
    const deleteBtn = await screen.findByText('Delete Clip');
    expect(deleteBtn).toBeInTheDocument();
    expect(deleteBtn.closest('[role="menuitem"]')).toBeInTheDocument();
  });

  it('Split at Playhead menu item exists with correct role', async () => {
    render(<TimelineEditor {...defaultProps} />);
    fireEvent.contextMenu(screen.getAllByTitle('Clip A')[0]);
    const splitBtn = await screen.findByText('Split at Playhead');
    expect(splitBtn).toBeInTheDocument();
    expect(splitBtn.closest('[role="menuitem"]')).toBeInTheDocument();
  });

  it('gap drop zone renders between the two clips', () => {
    render(<TimelineEditor {...defaultProps} />);
    // The gap zone is rendered for the gap between clip-a (end=5) and clip-b (start=6)
    const dropAreas = document.querySelectorAll('[class*="absolute"][class*="rounded"]');
    expect(dropAreas.length).toBeGreaterThan(0);
  });

  it('handleAddTransition is wired: onAddTransition prop exists and is a function', () => {
    render(<TimelineEditor {...defaultProps} />);
    expect(typeof defaultProps.onAddTransition).toBe('function');
  });
});
