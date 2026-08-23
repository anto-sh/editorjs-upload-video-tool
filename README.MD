# Upload Video Tool for Editor.js

Video Block tool for [Editor.js](https://editorjs.io) that uploads video files — either through **your own custom uploader function**, or a built-in `fetch()`-based uploader pointed at a single endpoint.

[![npm version](https://badge.fury.io/js/editorjs-upload-video-tool.svg)](https://www.npmjs.com/package/editorjs-upload-video-tool)
![](https://badgen.net/badge/Editor.js/v2.31.6/blue)
[![Socket Badge](https://badge.socket.dev/npm/package/editorjs-upload-video-tool)](https://badge.socket.dev/npm/package/editorjs-upload-video-tool)

## Features

- Renders an uploaded video with the native `<video>` element
- Two ways to upload: a custom `uploader` function, or a built-in `fetch()`-based uploader (`byEndpoint`)
- Drag & drop and clipboard paste, in addition to the file picker — same upload/validation pipeline
- Client-side validation: file type/extension and max file size
- Optional, editable caption
- Optional tunes: border, background, stretch, caption — each independently toggleable by config `featureFlags`
- Read-only mode supported
- Fully themeable via CSS overrides
- Two combinable ways to localize every UI string — see [Internationalization](#internationalization)

## Installation

### Install via NPM

```shell
npm install editorjs-upload-video-tool
```

or with yarn:

```shell
yarn add editorjs-upload-video-tool
```

or with pnpm:

```shell
pnpm add editorjs-upload-video-tool
```

Then include the module in your bundle:

```javascript
import UploadVideoTool from "editorjs-upload-video-tool";
```

### Requirements

- [`@editorjs/editorjs`](https://github.com/codex-team/editor.js) `^2.x` installed alongside it

## Usage

Give the tool exactly one of `uploader` or `byEndpoint`. \
If both are set, `uploader` wins; if neither is set, the tool throws a config error on first upload attempt.

### Option A: custom `uploader`

Receives the selected `File`, must resolve to `{ url: string, ... }`.

```typescript
import EditorJS from "@editorjs/editorjs";
import UploadVideoTool, {
  UploadVideoToolConfig,
} from "editorjs-upload-video-tool";

const editor = new EditorJS({
  tools: {
    video: {
      class: UploadVideoTool,
      config: {
        uploader: async (file) => {
          const formData = new FormData();
          formData.append("video", file);

          const response = await fetch("https://your-server.com/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error("Upload failed");
          }

          const result = await response.json();
          return { url: result.url };
        },
        errorHandler: (error) => {
          console.error("Video upload failed:", error);
        },
      } as UploadVideoToolConfig,
    },
  },
});
```

> **TS:** cast `config` as `UploadVideoToolConfig` (as above) — Editor.js's own types don't link a tool's `config` to its own config type, so without the cast you get no autocomplete/checking.

### Option B: `byEndpoint`

Skip `uploader`, point `byEndpoint` at your route — the built-in `fetch()` uploader handles the request:

```javascript
config: {
  byEndpoint: {
    url: "https://your-server.com/upload",
    fileFieldName: "video", // FormData field name, defaults to 'video'
    credentials: "include", // forwards cookies on cross-origin requests
    additionalRequestHeaders: {
      Authorization: "Bearer your-token",
    },
    additionalRequestData: {
      folder: "user-uploads",
    },
  },
}
```

The endpoint must respond with JSON containing a `url` field — same contract as the custom `uploader`.

## Config Params

| Field                | Type                                                                               | Required                         | Default                                                             | Description                                                                          |
| -------------------- | ---------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `uploader`           | `(file: File) => Promise<{ url: string, [key: string]: any }>`                     | One of `uploader` / `byEndpoint` | —                                                                   | Takes priority over `byEndpoint` if both are set.                                    |
| `byEndpoint`         | `object`                                                                           | One of `uploader` / `byEndpoint` | —                                                                   | Built-in `fetch()` uploader — see [below](#byendpoint).                              |
| `videoAcceptFormats` | `Array<'video/mp4' \| 'video/webm' \| 'video/ogg' \| '.mp4' \| '.webm' \| '.ogg'>` | No                               | `['video/mp4', 'video/webm', 'video/ogg', '.mp4', '.webm', '.ogg']` | Drives the file dialog's `accept` _and_ validation — see [Validation](#validation).  |
| `maxFileSize`        | `number` (bytes)                                                                   | No                               | no limit                                                            | Rejects files larger than this before uploading.                                     |
| `errorHandler`       | `(error: Error) => void`                                                           | No                               | shows `alert()` and re-throws                                       | Called for upload errors _and_ validation failures.                                  |
| `featureFlags`       | `object`                                                                           | No                               | all `true`                                                          | Enables/disables individual tunes — see below.                                       |
| `texts`              | `object`                                                                           | No                               | see [below](#texts)                                                 | Overrides individual UI strings — see [Internationalization](#internationalization). |

#### `byEndpoint`

| Field                      | Type                                                          | Required | Default                           | Description                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------- | -------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                      | `string`                                                      | **Yes**  | —                                 | The endpoint the file is POSTed to.                                                                                                         |
| `fileFieldName`            | `string`                                                      | No       | `'video'`                         | `FormData` field name the file is attached under.                                                                                           |
| `credentials`              | `RequestCredentials` (`'omit' \| 'same-origin' \| 'include'`) | No       | fetch's default (`'same-origin'`) | Passed straight to `fetch`. Use `'include'` for cross-origin cookie sessions.                                                               |
| `additionalRequestHeaders` | `HeadersInit`                                                 | No       | —                                 | Extra headers, e.g. `Authorization`. `Content-Type`, if present, is stripped automatically — needed for the `multipart/form-data` boundary. |
| `additionalRequestData`    | `Record<string, string>`                                      | No       | —                                 | Extra string fields appended to the `FormData` body, e.g. a CSRF token.                                                                     |

#### `texts`

All fields are optional strings.

| Field                       | Default                      |
| --------------------------- | ---------------------------- |
| `uploadButtonText`          | `'Upload Video'`             |
| `changeVideoButtonText`     | `'Change Video'`             |
| `videoCaptionPlaceholder`   | `'Caption for video'`        |
| `uploaderReturnedNoUrlText` | `'Uploader returned no URL'` |
| `uploadFailedText`          | `'Upload failed'`            |
| `wrongFileTypeText`         | `'Unsupported video format'` |
| `fileTooLargeText`          | `'Video is too large'`       |

### `featureFlags`

| Flag               | Default | Description                                                                 |
| ------------------ | ------- | --------------------------------------------------------------------------- |
| `border`           | `true`  | Show the "With border" tune.                                                |
| `background`       | `true`  | Show the "With background" tune.                                            |
| `stretch`          | `true`  | Show the "Stretch video" tune.                                              |
| `caption`          | `true`  | Show the "With caption" tune.                                               |
| `chooseFileOnInit` | `true`  | Automatically open the file picker right after a new, empty Block is added. |

> **Note:** `chooseFileOnInit` only fires for empty Blocks (skipped if `data.url` is already set), and only actually opens the dialog after a real user gesture — browsers block it otherwise. \
> Delayed by 50ms to avoid a race with paste / drag & drop ([editor.js#2065](https://github.com/codex-team/editor.js/issues/2065)).

> **Note:**
> Turning a tune off via `featureFlags` only hides it from the settings menu and skips its visual styling — it doesn't clear the tune's value from the saved data.\
> A caption saved while `withCaption: true` stays in the output even after you set `featureFlags.caption: false`.\
> Only toggling the tune itself off (`withCaption: false`) drops it.\
> The same applies to `withBorder`, `withBackground`, and `stretched`.

```javascript
config: {
  uploader: async (file) => ({ url: '...' }),
  featureFlags: {
    background: false,
    chooseFileOnInit: false,
  },
}
```

## Drag & drop and paste

Also works by dragging a file onto the editor or pasting it — goes through the same `uploader`/`byEndpoint`, `videoAcceptFormats`, and `maxFileSize` as the file dialog.

Accepted types for this path are fixed to `.mp4`/`.webm`/`.ogg` regardless of `videoAcceptFormats` (Editor.js's `pasteConfig` is static).\
The `videoAcceptFormats` validation is still applied when the file reaches the tool.

## Validation

Type is checked against `videoAcceptFormats` — only `mp4`/`webm`/`ogg` are valid, since that's all the `<video>` tag itself supports.\
Size is checked against `maxFileSize`, if set. Either failure goes through `errorHandler` (or `alert()`), same as an upload error.

## Tool's settings (tunes)

When a Block is selected, its toolbar exposes up to four tunes (each can be hidden via `featureFlags`):

| Tune            | Effect                                                                   |
| --------------- | ------------------------------------------------------------------------ |
| With border     | Adds a border around the video container.                                |
| With background | Adds padding and a background color, and shrinks the video to 60% width. |
| Stretch video   | Stretches the Block to the full editor width.                            |
| With caption    | Reveals an editable caption field under the video.                       |

## Output data

| Field            | Type                  | Description                                                     |
| ---------------- | --------------------- | --------------------------------------------------------------- |
| `url`            | `string`              | URL of the uploaded video.                                      |
| `caption`        | `string \| undefined` | Caption HTML — present only when the "With caption" tune is on. |
| `withBorder`     | `boolean`             | State of the "With border" tune.                                |
| `withBackground` | `boolean`             | State of the "With background" tune.                            |
| `stretched`      | `boolean`             | State of the "Stretch video" tune.                              |
| `withCaption`    | `boolean`             | State of the "With caption" tune.                               |

```json
{
  "type": "video",
  "data": {
    "url": "https://example.com/uploads/demo.mp4",
    "caption": "A short clip of the demo",
    "withBorder": false,
    "withBackground": false,
    "stretched": true,
    "withCaption": true
  }
}
```

A Block without a `url` is treated as invalid and is dropped from the saved output.

## Styling

Here's the full list of CSS custom properties and classes you can override to customize the tool's look.\
Class names follow BEM.

#### Variables

CSS custom properties for quick re-theming.

| Variable         | Default   | Used for                                                                              |
| ---------------- | --------- | ------------------------------------------------------------------------------------- |
| `--bg-color`     | `#cdd1e0` | Loading indicator background; video container background when "With background" is on |
| `--front-color`  | `#388ae5` | Loading indicator icon color                                                          |
| `--border-color` | `#e8e8eb` | Video container border when "With border" is on, and while a file is uploading        |

```css
.upload-video {
  --bg-color: #cdd1e0;
  --front-color: #388ae5;
  --border-color: #e8e8eb;
}
```

#### Elements

Main structural classes of the Block.

| Class                              | Applied to                         | Description                                                              |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `.upload-video`                    | Root Block container               | Top-level wrapper; hosts the CSS custom properties and modifier classes. |
| `.upload-video__video-container`   | `<div>` wrapping the video         | Positions the video and the loading indicator.                           |
| `.upload-video__video`             | `<video>`                          | The rendered video element.                                              |
| `.upload-video__loading-indicator` | `<div>` inside the video container | Spinner overlay shown while the upload is running.                       |
| `.upload-video__caption`           | `<div contenteditable>`            | The editable caption field.                                              |
| `.upload-video__upload-btn`        | Initial upload button              | Shown before any video is uploaded.                                      |
| `.upload-video__change-btn`        | "Change Video" button              | Shown under an already-uploaded video.                                   |
| `.upload-video__loader-btn`        | Both `upload-btn` and `change-btn` | Shared class used to hide the buttons while uploading.                   |

#### Modifiers

Added to the root `.upload-video` container.

| Class                           | Added when                         |
| ------------------------------- | ---------------------------------- |
| `.upload-video--withBorder`     | The "With border" tune is on       |
| `.upload-video--withBackground` | The "With background" tune is on   |
| `.upload-video--stretched`      | The "Stretch video" tune is on     |
| `.upload-video--withCaption`    | The "With caption" tune is on      |
| `.upload-video--uploading`      | A file is currently being uploaded |

For example, a dark theme that also tightens the background padding and italicizes the caption:

```css
.upload-video {
  --bg-color: #2a2d3a;
  --front-color: #7dd3fc;
  --border-color: #3f4257;
}

.upload-video--withBackground .upload-video__video-container {
  padding: 8px;
}

.upload-video__caption {
  font-style: italic;
}
```

## Internationalization

Two ways to translate strings, freely combinable — `texts` wins when both provide a value for the same string.

**`texts` config field** — covers the 7 fields under [`texts`](#texts):

```javascript
config: {
  texts: {
    uploadButtonText: "Upload the video, please",
  },
},
```

**Editor.js's own i18n dictionary** — covers every string, including tune labels:

```javascript
i18n: {
  messages: {
    tools: {
      video: { // key must match your tools registration
        "Upload Video": "Upload the video, please",
        "With border": "With outline",
      },
    },
  },
},
```

The toolbox title isn't passed through `t()` — translate it via `toolNames` instead:

```javascript
i18n: { messages: { toolNames: { "Upload Video": "Video" } } },
```

### All strings passed through `this.api.i18n.t()`

| String                                                               | `texts` field               |
| -------------------------------------------------------------------- | --------------------------- |
| `Upload Video`                                                       | `uploadButtonText`          |
| `Change Video`                                                       | `changeVideoButtonText`     |
| `Caption for video`                                                  | `videoCaptionPlaceholder`   |
| `Uploader returned no URL`                                           | `uploaderReturnedNoUrlText` |
| `Upload failed`                                                      | `uploadFailedText`          |
| `Unsupported video format`                                           | `wrongFileTypeText`         |
| `Video is too large`                                                 | `fileTooLargeText`          |
| `Validation error`                                                   | —                           |
| `With border` / `With background` / `Stretch video` / `With caption` | —                           |
| `No video container!`                                                | —                           |
| `Config error: neither 'uploader' nor 'byEndpoint.url' is defined.`  | —                           |

## Read-only mode

The tool declares `isReadOnlySupported = true`.\
In read-only mode the upload/change buttons are hidden and the caption becomes non-editable, while any tunes saved with the data are still applied.

## License

MIT
