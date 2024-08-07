export default `<div data-component="Modal">
  <!--
    Modal opening trigger.
    This ref will be used to open the modal on click.
  -->
  <button data-ref="open[]" type="button" class="py-2 px-4 text-white rounded bg-black focus:opacity-50">
    Open
  </button>
  <!-- Modal element -->
  <div data-ref="modal" role="dialog" aria-modal="true" aria-hidden="true" style="opacity: 0; pointer-events: none; visibility: hidden;" class="z-goku fixed inset-0">
    <!--
      Modal overlay
      The \`tabindex="-"\` attribute is required.
    -->
    <div data-ref="overlay" tabindex="-1" class="z-under absolute inset-0 bg-black opacity-75"></div>
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <!--
        Modal container
        This is the element in which the user can scroll
        if the content of the modal is too long.
      -->
      <div data-ref="container" class="z-above relative max-h-full overflox-x-hidden overflow-y-auto bg-white rounded shadow-l pointer-events-auto">
        <!--
          Modal close button
          This will be used to close the modal on click.
        -->
        <button data-ref="close[]" type="button" class="absolute top-0 right-0 m-2 py-2 px-4 text-white rounded bg-black focus:opacity-50">
          Close
        </button>
        <!--
          Modal content
          The content displayed in the modal.
          The \`max-w-3xl\` class defines the modal width.
        -->
        <div class="max-w-3xl p-10 pt-16" data-ref="content">
          Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae laudantium sint culpa sequi enim <a href="#" class="border-b">quaerat</a> itaque possimus at <a autofocus href="#" class="border-b">voluptatem</a> voluptates voluptatum velit illum nulla, optio porro ea. Doloremque, aut, beatae!
        </div>
      </div>
    </div>
  </div>
</div>
`
