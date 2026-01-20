// Move sf components from DMFE

class SFDetails extends HTMLElement {
   constructor() {
      super();
      this.isOpen = new Sfignal() // check for set state ^
      this.unsubscribe = this.isOpen.subscribe(() => this.sync);
   }

   disconnectedCallback() {
      this.unsubscribe();
   }

   sync = () => {
      if (this.isOpen) {
         this.style.height = "auto";
      } else {
         this.style.height = "0";
      }
      // check how i did stuff in the mobile menu
   }
}
customElements.define('sf-details', SFDetails);

class SFDetailToggle extends HTMLElement {
   constructor() {
      super();
   }

   connectedCallback() {
      this.target = document.getElementById(this.getAttribute('for'));
      if (this.target) {
         this.unsubscribe = this.target.isOpen.subscribe(() => this.sync);
         this.onclick = () => this.target.isOpen.state = !this.target.isOpen.state;
      }
   }

   disconnectedCallback() {
      this.unsubscribe();
   }

   sync = () => {
      // rotate arrow
   }
}