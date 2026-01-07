<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { keymap } from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

const props = defineProps<{
  modelValue: string;
  errorLine?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'paste', event: ClipboardEvent): void;
}>();

const editorRef = ref<HTMLDivElement>();
const viewRef = shallowRef<EditorView>();

// 自定义主题 - 适配毛玻璃风格
const glassTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#e0e0e0',
    height: '100%',
  },
  '.cm-content': {
    caretColor: '#ffffff',
    fontFamily: "'Fira Code', 'Monaco', 'Consolas', monospace",
  },
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
  },
  '.cm-gutters': {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    color: '#888',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '.cm-errorLine': {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderLeft: '2px solid #ef4444',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
      glassTheme,
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

// 错误行处理
watch(() => props.errorLine, () => {
  // 错误行高亮逻辑可以在此扩展
});

// 粘贴处理
const handlePaste = (event: ClipboardEvent) => {
  emit('paste', event);
};

// 获取编辑器内容
const getValue = () => viewRef.value?.state.doc.toString() || '';

// 聚焦编辑器
const focus = () => viewRef.value?.focus();

defineExpose({
  getValue,
  focus,
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
  overflow: hidden;
  border-radius: 8px;
}
</style>
