let alertTimeout

function showAlert(message, type = 'success', duration = 3000) {
  const alert = document.getElementById('alert-notification')
  const alertText = document.getElementById('alert-text')

  if (alertTimeout) {
    clearTimeout(alertTimeout)
  }

  alertText.textContent = message
  alert.classList.remove('success', 'error', 'warning')
  alert.classList.add(type)
  alert.classList.add('show')

  if (duration > 0) {
    alertTimeout = setTimeout(() => {
      closeAlert()
    }, duration)
  }
}

function closeAlert() {
  const alert = document.getElementById('alert-notification')
  alert.classList.remove('show')

  if (alertTimeout) {
    clearTimeout(alertTimeout)
    alertTimeout = null
  }
}

const cartModal = document.getElementById('cart-modal')
const cartBtn = document.getElementById('cart-btn')
const closeCart = document.getElementById('close-cart')
const cartCount = document.getElementById('cart-count')
const cartItems = document.getElementById('cart-items')
const cartTotal = document.getElementById('cart-total')
const finalizarCompra = document.getElementById('finalizar-compra')

if (cartBtn && cartModal) {
  cartBtn.addEventListener('click', () => {
    cartModal.classList.add('mostrar')
    updateCartDisplay()
  })
}

if (closeCart && cartModal) {
  closeCart.addEventListener('click', () => {
    cartModal.classList.remove('mostrar')
  })
}

if (finalizarCompra) {
  finalizarCompra.addEventListener('click', () => {
    // Verificar se o carrinho está vazio
    fetch('/cart.js')
      .then((response) => response.json())
      .then((data) => {
        if (data.item_count === 0) {
          showAlert('Você deve ter templates no carrinho para finalizar a compra!', 'warning')
        } else {
          window.location.href = '/checkout'
        }
      })
      .catch((error) => {
        console.error('Erro ao verificar carrinho:', error)
        showAlert('Erro ao verificar carrinho!', 'error')
      })
  })
}

document.addEventListener('click', (e) => {
  if (e.target.id && e.target.id.startsWith('add-to-cart-')) {
    const button = e.target
    const product = {
      id: button.dataset.variantId,
      title: button.dataset.productTitle,
      price: button.dataset.productPrice,
      quantity: 1
    }

    addToCart(product, button)
  }

  if (e.target.id === 'add-to-cart-product') {
    const button = e.target
    const form = document.getElementById('product-form')
    const quantityInput = form.querySelector('input[name="quantity"]')
    const variantInput = form.querySelector('input[name="id"]')

    const product = {
      id: variantInput.value,
      title: button.dataset.productTitle,
      price: button.dataset.productPrice,
      quantity: parseInt(quantityInput.value) || 1
    }

    addToCart(product, button)
  }
})

function addToCart(product, button) {
  button.classList.add('loading')
  button.disabled = true

  // Primeiro verificar se o produto já está no carrinho
  fetch('/cart.js')
    .then((response) => response.json())
    .then((cartData) => {
      // Verificar se o produto já existe no carrinho
      const existingItem = cartData.items.find((item) => item.variant_id.toString() === product.id.toString())

      if (existingItem) {
        // Produto já existe no carrinho
        showAlert('Só é permitida uma unidade por template no carrinho!', 'warning')
        button.classList.remove('loading')
        button.disabled = false
        return
      }

      // Se não existe, adicionar ao carrinho
      return fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [
            {
              id: product.id,
              quantity: product.quantity
            }
          ]
        })
      })
    })
    .then((response) => {
      if (!response) return // Se o produto já existia, não faz nada
      return response.json()
    })
    .then((data) => {
      if (!data) return // Se o produto já existia, não faz nada

      updateCartCount()
      updateCartItems()
      // Abrir o carrinho automaticamente
      if (cartModal) {
        cartModal.classList.add('mostrar')
      }
      showAlert('Template adicionado ao carrinho!', 'success')
    })
    .catch((error) => {
      console.error('Erro ao adicionar ao carrinho:', error)
      showAlert('Erro ao adicionar template ao carrinho!', 'error')
    })
    .finally(() => {
      button.classList.remove('loading')
      button.disabled = false
    })
}

function updateCartDisplay() {
  fetch('/cart.js')
    .then((response) => response.json())
    .then((data) => {
      updateCartCount()
      updateCartItems()

      if (cartTotal) {
        cartTotal.textContent = formatMoney(data.total_price)
      }
    })
    .catch((error) => {
      console.error('Erro ao atualizar carrinho:', error)
    })
}

function updateCartItems() {
  if (!cartItems) return

  fetch('/cart.js')
    .then((response) => response.json())
    .then((data) => {
      if (data.item_count > 0) {
        const itemsHTML = data.items
          .map(
            (item) => `
          <div class="item" data-variant-id="${item.variant_id}">
            <div class="imagem">
              <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="nome">
              <h4>${item.title}</h4>
              <p>${formatMoney(item.final_price)}</p>
            </div>
            <button class="remover" onclick="removeFromCart('${item.variant_id}')">
              <span class="loading-spinner"></span>
              <span class="button-content">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" ><path d="m29 6h-7.09a5.9925 5.9925 0 0 0 -11.82 0h-7.09a1 1 0 0 0 0 2h2v20a3.0033 3.0033 0 0 0 3 3h16a3.0033 3.0033 0 0 0 3-3v-20h2a1 1 0 0 0 0-2zm-13-3a3.9955 3.9955 0 0 1 3.858 3h-7.716a3.9955 3.9955 0 0 1 3.858-3zm-4 21a1 1 0 0 1 -2 0v-11a1 1 0 0 1 2 0zm5 0a1 1 0 0 1 -2 0v-11a1 1 0 0 1 2 0zm5 0a1 1 0 0 1 -2 0v-11a1 1 0 0 1 2 0z"></path></svg>
              </span>
            </button>
          </div>
        `
          )
          .join('')

        cartItems.innerHTML = itemsHTML
      } else {
        cartItems.innerHTML = '<p class="vazio">Nenhum template no carrinho</p>'
      }

      if (cartTotal) {
        cartTotal.textContent = formatMoney(data.total_price)
      }
    })
    .catch((error) => {
      console.error('Erro ao atualizar itens do carrinho:', error)
    })
}

function removeFromCart(variantId) {
  // Encontrar o botão específico que foi clicado
  const button = document.querySelector(`.remover[onclick*="${variantId}"]`)

  if (button) {
    button.classList.add('loading')
    button.disabled = true
  }

  fetch('/cart/change.js', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: variantId,
      quantity: 0
    })
  })
    .then((response) => response.json())
    .then((data) => {
      updateCartCount()
      updateCartItems()
      // Manter o carrinho aberto após remover item
      showAlert('Template removido do carrinho!', 'warning')
    })
    .catch((error) => {
      console.error('Erro ao remover do carrinho:', error)
      showAlert('Erro ao remover template do carrinho!', 'error')
    })
    .finally(() => {
      if (button) {
        button.classList.remove('loading')
        button.disabled = false
      }
    })
}

function updateCartCount() {
  if (!cartCount) return

  fetch('/cart.js')
    .then((response) => response.json())
    .then((data) => {
      const count = data.item_count
      cartCount.textContent = count
    })
    .catch((error) => {
      console.error('Erro ao buscar contagem do carrinho:', error)
    })
}

function formatMoney(cents) {
  if (typeof cents === 'string') {
    return cents
  }
  return 'R$ ' + (cents / 100).toFixed(2).replace('.', ',')
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    updateCartCount()
  }, 100)
})
