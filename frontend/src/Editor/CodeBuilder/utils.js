import _ from 'lodash';
import Fuse from 'fuse.js';

export function generateHints(word, currentState) {
  let suggestions = [];
  _.keys(currentState).forEach((key) => {
    _.keys(currentState[key]).forEach((key2) => {
      _.keys(currentState[key][key2]).forEach((key3) => {
        suggestions.push(`${key}.${key2}.${key3}`)
      })
    })
  });

  if(word === '') {
    return suggestions;
  }

  const fuse = new Fuse(suggestions);
  return fuse.search(word).map((result) => result.item);
}

export function computeCurrentWord(editor, _cursorPosition) {
  const cursor = editor.getCursor();
  const line = cursor.line;
  const value = editor.getLine(line);
  const sliced = value.slice(0, _cursorPosition);
  const split = sliced.split('{{');
  const lastWord = split[split.length - 1];
  return lastWord;
}

export function makeOverlay(style) {
  return {
    token: function (stream, state) {
      var ch;
      if (stream.match("{{")) {
        while ((ch = stream.next()) != null)
          if (ch == "}" && stream.next() == "}") {
            stream.eat("}");
            return style;
          }
      }
      while (stream.next() != null && !stream.match("{{", false)) { }
      return null;
    }
  }
}

export function onBeforeChange(editor, change) {
  const cursor = editor.getCursor();
  const line = cursor.line;
  const ch = cursor.ch;
  const value = editor.getLine(line);
  const isLastCharacterBrace = value.slice(ch - 1, value.length) === '{';

  if (isLastCharacterBrace && change.origin === '+input') {
    change.text[0] = '{}}'
    // editor.setCursor({ line: 0, ch: ch })
  }

  return change;
}

export function canShowHint(editor) {
  const cursor = editor.getCursor();
  const line = cursor.line;
  const ch = cursor.ch;
  const value = editor.getLine(line)
  return value.slice(ch, ch + 2) === '}}';
}

export function handleChange(editor, onChange, currentState) {

  const value = editor.getValue();
  onChange(value);

  let state = editor.state.matchHighlighter;
  editor.addOverlay(state.overlay = makeOverlay(state.options.style));

  const cursor = editor.getCursor();
  const currentWord = computeCurrentWord(editor, cursor.ch);
  const hints = generateHints(currentWord, currentState);

  const options = {
    alignWithWord: true,
    hint: function () {
      return {
        from: { line: cursor.line, ch: cursor.ch - currentWord.length },
        to: cursor,
        list: hints
      }
    }
  };
  if (canShowHint(editor)) {
    editor.showHint(options);
  }
};