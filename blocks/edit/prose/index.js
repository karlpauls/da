import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { baseKeymap } from "prosemirror-commands"
import { schema as baseSchema } from "prosemirror-schema-basic";
import { history } from 'prosemirror-history';
import { addListNodes } from "prosemirror-schema-list";
import { keymap } from 'prosemirror-keymap';
import { buildKeymap } from "prosemirror-example-setup";
import prose2aem from '../../shared/prose2aem.js';

import {
  tableEditing,
  columnResizing,
  goToNextCell,
  tableNodes,
  fixTables } from 'prosemirror-tables';
import menu from './plugins/menu.js';
import imageDrop from './plugins/imageDrop.js';

function getSchema() {
  const { marks, nodes: baseNodes } = baseSchema.spec;
  const withListnodes = addListNodes(baseNodes, 'block+', 'block');
  const nodes = withListnodes.append(tableNodes({ tableGroup: 'block', cellContent: 'block+' }));
  return new Schema({ nodes, marks });
}

let sendUpdates = false;
let hasChanged = 0;
function dispatchTransaction(transaction) {
  if (transaction.docChanged) {
    hasChanged += 1;
    sendUpdates = true;
  }
  const newState = view.state.apply(transaction);
  view.updateState(newState)
}

function pollForUpdates() {
  const daContent = document.querySelector('da-content');
  const daPreview = daContent.shadowRoot.querySelector('da-preview');
  const proseEl = window.view.root.querySelector('.ProseMirror');
  if (!daPreview) return;
  setInterval(() => {
    if (sendUpdates) {
      if (hasChanged > 0) {
        hasChanged = 0;
        return;
      }
      const clone = proseEl.cloneNode(true);
      const body = prose2aem(clone);
      daPreview.body = body;
      sendUpdates = false;
    }
  }, 1000);
}

export default function initProse(editor, content) {
  const schema = getSchema();

  const doc = DOMParser.fromSchema(schema).parse(content);

  let state = EditorState.create({
    doc,
    plugins: [
      menu,
      imageDrop(schema),
      columnResizing(),
      tableEditing(),
      keymap(buildKeymap(schema)),
      keymap(baseKeymap),
      keymap({
        Tab: goToNextCell(1),
        'Shift-Tab': goToNextCell(-1),
      }),
      history(),
    ],
  });

  const fix = fixTables(state);
  if (fix) state = state.apply(fix.setMeta('addToHistory', false));

  window.view = new EditorView(editor, { state, dispatchTransaction });

  // This is a demo showing how we can insert nodes without any extra gaps
  // setTimeout(() => {
  //   console.log(schema.nodes);
  //   const { horizontal_rule, heading } = schema.nodes;
  //   const hr = horizontal_rule.create();
  //   const para = heading.create(null, schema.text('columns'));
  //   const fragment = Fragment.fromArray([hr, para]);
  //   window.view.dispatch(window.view.state.tr.replaceSelectionWith(fragment.content[0]));
  // }, 4000);

  document.execCommand('enableObjectResizing', false, 'false');
  document.execCommand('enableInlineTableEditing', false, 'false');

  pollForUpdates();
}
