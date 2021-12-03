export default {
  title: 'Draggable',
};

export const Draggable = {
  parameters: {
    server: {
      id: 'Draggablee',
      async fetchStoryHtml() {
        return `
<div data-component="Draggable" class="w-48 h-48 rounded bg-black cursor-grab active:cursor-grabbing"></div>
        `;
      },
    },
  },
};
