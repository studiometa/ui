let callbacks = [];
const observer = new MutationObserver((mutations) => {
    callbacks.forEach(callback => {
      callback(mutations, observer)
    });
});

export default function useObserver(callback: MutationCallback) {
  callbacks.push(callback);

  function cleanup() {
    callbacks = callbacks.filter(cb => cb !== callback);
  }

  function observe(element, options) {
    observer.observe(element, options);
  }

  function disconnect() {
    observer.disconnect();
  }

  return {
    observe,
    cleanup,
    disconnect,
  }
};
