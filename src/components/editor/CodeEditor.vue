<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'paste', event: ClipboardEvent): void;
}>();

const editorRef = ref<HTMLDivElement>();
const viewRef = shallowRef<EditorView>();

// 自定义主题 - 适配毛玻璃风格
const glassEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    color: '#334155',
    height: '100%',
    fontSize: '15px',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: '#0f172a',
    fontFamily: "'Fira Code', 'JetBrains Mono', 'Monaco', 'Consolas', monospace",
    lineHeight: '1.7',
  },
  '.cm-cursor': {
    borderLeftColor: '#0f172a',
    borderLeftWidth: '2px',
  },
  '.cm-gutters': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#94a3b8',
    borderRight: '1px solid rgba(255, 255, 255, 0.3)',
    paddingRight: '8px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    color: '#0ea5e9',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(56, 189, 248, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(56, 189, 248, 0.3) !important',
  },
  '.cm-line': {
    padding: '4px 0',
  },
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderRadius: '2px',
  },
  '.cm-nonmatchingBracket': {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '2px',
  },
});

onMounted(() => {
  if (!editorRef.value) return;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      markdown(),
      keymap.of([indentWithTab, ...defaultKeymap]),
      syntaxHighlighting(defaultHighlightStyle),
      glassEditorTheme,
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          emit('update:modelValue', update.state.doc.toString());
        }
      }),
    ],
  });

  viewRef.value = new EditorView({
    state,
    parent: editorRef.value,
  });
});

onBeforeUnmount(() => {
  viewRef.value?.destroy();
});

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (viewRef.value && newValue !== viewRef.value.state.doc.toString()) {
    viewRef.value.dispatch({
      changes: { from: 0, to: viewRef.value.state.doc.length, insert: newValue },
    });
  }
});

// 粘贴处理
const handlePaste = (event: ClipboardEvent) => {
  emit('paste', event);
};

// 获取编辑器内容
const getValue = () => viewRef.value?.state.doc.toString() || '';

// 聚焦编辑器
const focus = () => viewRef.value?.focus();

// 撤销
const doUndo = () => {
  if (viewRef.value) {
    undo(viewRef.value);
  }
};

// 重做
const doRedo = () => {
  if (viewRef.value) {
    redo(viewRef.value);
  }
};

defineExpose({
  getValue,
  focus,
  doUndo,
  doRedo,
});
</script>

<template>
  <div
    ref="editorRef"
    class="code-editor h-full w-full"
    @paste="handlePaste"
  />
</template>

<style scoped>
.code-editor {
  height: 100%;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.2);
}

.code-editor :deep(.cm-editor) {
  height: 100%;
}

.code-editor :deep(.cm-scroller) {
  overflow: auto;
}
</style>
