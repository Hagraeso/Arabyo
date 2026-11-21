# Content file format

This guide is for contributors who add or change Arabyo's learning content (levels, words, images and sounds). The curriculum itself is described in [curriculum.md](curriculum.md).

All content lives in the `content/` folder as plain JSON files, saved as UTF-8 (no BOM). The code never contains curriculum content: it only reads the files in `content/`, so changing the curriculum never needs a code change.

## Layout

```text
content/
  levels.json          list of all levels, in order
  level-0/
    level.json         the level file for level 0
    images/            image files for level 0 (added in a later step)
    audio/
      ar/              Arabic recordings (added in a later step)
      sv/              Swedish recordings (added in a later step)
  level-1/
    ...
```

There is one folder per level, named `level-N` (for example `content/level-0/`). Each level folder holds its own level file and its own images and audio, so a level can be downloaded on its own when the child reaches it.

All image and audio paths inside a level file are relative to that level's folder. For example, `images/cat.svg` in `content/level-0/level.json` means `content/level-0/images/cat.svg`.

## levels.json

`content/levels.json` lists every level. The order of the `levels` array is the level order.

```json
{
  "levels": [
    { "level": 0, "folder": "level-0", "file": "level.json", "contentVersion": 1 }
  ]
}
```

| Field | Type | Meaning |
| --- | --- | --- |
| `level` | integer | The level number (0 to 8). |
| `folder` | string | The level's folder, relative to `content/`. |
| `file` | string | The level file's name inside that folder. |
| `contentVersion` | integer | The level's content version. Must match `contentVersion` in the level file. |

## Level file

Each level file (for example `content/level-0/level.json`) has these top-level fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `level` | integer | The level number. Must match the entry in `levels.json`. |
| `contentVersion` | integer | The level's content version. Must match the entry in `levels.json`. |
| `items` | array | The level's items (for level 0, words), in teaching order. |

Each item in `items` has these fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | The item's id (see [id rules](#id-rules)). |
| `word` | string | The word in Arabic, fully vowel-marked, in dictionary form with tanween. |
| `syllables` | array of strings | The spoken syllables in order, each fully vowel-marked, in pausal form (see [Arabic text](#arabic-text)). |
| `category` | string | One of `animals`, `food`, `home`, `body`. |
| `sv` | string | The Swedish meaning. |
| `openmoji` | string | The OpenMoji hexcode of the image (for example `1F408`). |
| `image` | string | Path to the image: `images/<id>.svg`. |
| `audioAr` | string | Path to the Arabic recording of the word: `audio/ar/<id>.mp3`. |
| `audioSv` | string | Path to the Swedish recording of the meaning: `audio/sv/<id>.mp3`. |

## id rules

- Unique within the level.
- Lowercase ASCII letters, digits and hyphens only (for example `cat`, `ice-cream`).
- The English name of the word.
- Also used in the item's asset file names (`images/<id>.svg`, `audio/ar/<id>.mp3`, `audio/sv/<id>.mp3`), so changing an id means renaming its files too.

## Arabic text

- All Arabic text in the content files is fully vowel-marked (full tashkeel). Marks are only removed gradually in level 8, as described in the curriculum.
- `word` is the dictionary form with tanween, for example `قِطَّةٌ`.
- `syllables` follow the pausal spoken form: how the word sounds when it is said alone, without tanween and with the final sound stopped. For example `قِطَّةٌ` is said `قِطْ` + `طَهْ`. This is what the child hears and claps along to.

## Categories

`category` is one of `animals`, `food`, `home`, `body`. More categories from the curriculum (such as colours and numbers) will be added to this list when their words are added.

## Images

- Images are open-licensed only. OpenMoji (CC BY-SA 4.0) is the main source, and each item records its OpenMoji hexcode in `openmoji`.
- A word with no suitable open-licensed image is removed from the content. It is never given a wrong or misleading picture.

## Content versions

Whenever a level's content changes (items, text, images or audio), bump that level's `contentVersion` by 1, in both `levels.json` and the level file, and keep the two equal. Installed devices use this number to know that a level must be downloaded again.

## Credits

Every image and sound must be listed in [CREDITS.md](../CREDITS.md) with its source and licence before it is added.

## Images and audio come later

The level files already reference their image and audio files, but those files are added in later steps. Until then the referenced paths do not exist yet.

## Licence

Content (images, audio and text, including the files in `content/`) is licensed under CC BY-SA 4.0 — see [LICENSE-CONTENT.md](../LICENSE-CONTENT.md). The code is MIT-licensed and never contains curriculum content; it only reads `content/`.
