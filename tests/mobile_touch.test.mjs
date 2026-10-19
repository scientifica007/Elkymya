import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../src/body.html', import.meta.url), 'utf8');
const stage = css.match(/\.stage\{([^}]*)\}/)?.[1];
const atom = css.match(/\.stage-atom\{([^}]*)\}/)?.[1];
assert.ok(stage, 'The molecular stage CSS selector must exist');
assert.ok(atom, 'The atom CSS selector must exist');
assert.match(stage, /(?:^|;)touch-action:pan-y(?:;|$)/, 'A vertical touch starting in empty stage must allow native page scroll');
assert.match(atom, /(?:^|;)touch-action:none(?:;|$)/, 'Dragging an atom must retain pointer movement on touch devices');
assert.match(html, /مرّر الصفحة من فراغ المختبر/, 'Explain gesture boundaries to mobile users');
console.log('PASS: editor blank area permits native vertical scrolling while atoms retain touch drag');
