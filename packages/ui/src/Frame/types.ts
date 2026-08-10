import type { FrameAnchor } from './FrameAnchor.js';
import type { FrameForm } from './FrameForm.js';

export type FrameRequestInit = RequestInit & { trigger?: FrameAnchor | FrameForm };
export type FrameTriggerEvent = CustomEvent<[URL, FrameRequestInit]>;
export type FrameFetchEvent = CustomEvent<[URL, FrameRequestInit]>;
export type FrameFetchBeforeEvent = FrameFetchEvent;
export type FrameFetchAfterEvent = CustomEvent<[URL, FrameRequestInit, string | Error]>;
export type FrameErrorEvent = CustomEvent<[URL, FrameRequestInit, Error]>;
export type FrameContentEvent = CustomEvent<[URL, FrameRequestInit, string]>;
export type FrameContentAfterEvent = CustomEvent<[URL, FrameRequestInit, string]>;
