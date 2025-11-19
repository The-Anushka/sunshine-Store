// scripts.js - simple cart + GTM push helpers
(function(){
  // Utility: get / set cart in localStorage
  function getCart(){ try { return JSON.parse(localStorage.getItem('sun_cart') || '[]'); } catch(e){ return [] } }
  function saveCart(cart){ localStorage.setItem('sun_cart', JSON.stringify(cart)); }
  function calcTotal(cart){
    return cart.reduce((s,i)=> s + (Number(i.price)||0) * (Number(i.qty)||1), 0);
  }
  function saveTotal(total){ localStorage.setItem('sun_cart_total', total); }

  // Add to cart buttons
  document.querySelectorAll('[data-id]').forEach(btn=>{
    btn.addEventListener('click', function(){
      const id = this.dataset.id;
      const name = this.dataset.name || this.getAttribute('data-name') || 'Product';
      const price = Number(this.dataset.price || this.getAttribute('data-price') || 0);

      let cart = getCart();
      const existing = cart.find(i=> i.id === id);
      if(existing) existing.qty = Number(existing.qty||1)+1;
      else cart.push({ id, name, price, qty:1, image: this.closest('.product-card') ? this.closest('.product-card').querySelector('img')?.src : '' });

      saveCart(cart);
      const total = calcTotal(cart);
      saveTotal(total);

      // Push event to GTM/GA via dataLayer
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'add_to_cart',
        ecommerce: {
          items: [{ item_id: id, item_name: name, price: price, quantity: 1 }]
        }
      });

      alert(name + ' added to cart!');
    });
  });

  // Populate cart page
  function renderCart(){
    const cartList = document.getElementById('cart-list');
    if(!cartList) return;
    const cart = getCart();

    const emptyMsg = document.getElementById('empty-msg');
    const summary = document.getElementById('cart-summary');
    const totalEl = document.getElementById('cart-total');

    if(cart.length===0){
      cartList.innerHTML = '';
      if(emptyMsg) emptyMsg.style.display = 'block';
      if(summary) summary.classList.add('hidden');
      return;
    }

    if(emptyMsg) emptyMsg.style.display = 'none';
    if(summary) summary.classList.remove('hidden');

    cartList.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image || 'https://images.pexels.com/photos/3822625/pexels-photo-3822625.jpeg'}" alt="${item.name}">
        <div style="flex:1">
          <strong>${item.name}</strong>
          <div>₹${item.price} x <span class="qty">${item.qty}</span></div>
        </div>
        <div>
          <button class="btn decrease">-</button>
          <button class="btn increase">+</button>
          <button class="btn remove">Remove</button>
        </div>
      `;
      cartList.appendChild(div);

      // Handlers
      div.querySelector('.increase').addEventListener('click', ()=>{
        item.qty = (item.qty||1) + 1; saveCart(cart); renderCart();
      });
      div.querySelector('.decrease').addEventListener('click', ()=>{
        item.qty = Math.max(1, (item.qty||1) - 1); saveCart(cart); renderCart();
      });
      div.querySelector('.remove').addEventListener('click', ()=>{
        const idx = cart.findIndex(c=> c.id===item.id);
        if(idx>-1) cart.splice(idx,1);
        saveCart(cart); renderCart();
      });
    });

    const total = calcTotal(cart);
    if(totalEl) totalEl.textContent = '₹' + total;
    saveTotal(total);
  }

  // Run on pages
  document.addEventListener('DOMContentLoaded', function(){
    renderCart();

    // Example: send page_view event to dataLayer for products and cart pages (GTM can use Page Path triggers too)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'page_view', page_path: location.pathname });
  });

  // Checkout button (optional GTM event)
  const checkoutBtn = document.getElementById('checkout-btn');
  if(checkoutBtn) checkoutBtn.addEventListener('click', function(){
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'begin_checkout' });
  });

})();
