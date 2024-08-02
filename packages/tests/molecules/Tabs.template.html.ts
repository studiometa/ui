export default `<div data-component="Tabs" data-option-styles='{ "btn": { "open": { "borderBottomColor": "#fff" } } }'>
  <div class="flex px-10 border-b">
    <button data-ref="btn[]" class="-mb-px -ml-px p-4 bg-white border">
      Tab #1
    </button>
    <button data-ref="btn[]" class="-mb-px -ml-px p-4 bg-white border">
      Tab #2
    </button>
    <button data-ref="btn[]" class="-mb-px -ml-px p-4 bg-white border">
      Tab #3
    </button>
  </div>
  <div class="p-10 bg-white">
    <div data-ref="content[]" aria-hidden="false">
      Content #1
    </div>
    <div data-ref="content[]" aria-hidden="true">
      Content #2
    </div>
    <div data-ref="content[]" aria-hidden="true">
      Content #3
    </div>
  </div>
</div>
`
