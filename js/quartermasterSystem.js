// QUARTERMASTER SHOP SYSTEM
// Manages in-camp merchant interactions for selling and buying items

window.QuartermasterSystem = {
  // Shop inventory of standard items
  standardInventory: [
    { 
      templateId: 'cartridgePouch', 
      buyPrice: 40, 
      description: 'Powder & Shot Pouch for Rifles'
    },
    { 
      templateId: 'quiver', 
      buyPrice: 20, 
      description: 'Quiver for Arrows'
    },
    { 
      templateId: 'javelinPack', 
      buyPrice: 45, 
      description: 'Pack of Throwing Javelins'
    },
    { 
      templateId: 'rations', 
      buyPrice: 8, 
      description: 'Military Field Rations'
    },
    { 
      templateId: 'healthPotion', 
      buyPrice: 20, 
      description: 'Healing Potion'
    },
    { 
      templateId: 'staminaPotion', 
      buyPrice: 15, 
      description: 'Stamina Restoration Elixir'
    },
    { 
      templateId: 'repairKit', 
      buyPrice: 30, 
      description: 'Field Repair Kit for Armor and Weapons'
    }
  ],

  // Buying items from player
  calculateItemBuyback: function(item) {
    if (!item || !item.getTemplate) return 0;
    
    const template = item.getTemplate();
    let baseValue = template.value || 1;
    
    // Apply rarity multiplier
    baseValue *= template.rarity.multiplier;
    
    // Reduce value based on item's current durability
    if (item.durability !== undefined && template.maxDurability) {
      const durabilityPercentage = (item.durability / template.maxDurability);
      baseValue *= durabilityPercentage;
    }
    
    // Round to nearest integer
    return Math.round(baseValue * 0.5); // 50% of original value
  },

  // Open Quartermaster shop interface
  openShop: function() {
    const shopContainer = document.createElement('div');
    shopContainer.id = 'quartermaster-shop';
    shopContainer.className = 'shop-modal';
    
    // Create shop HTML
    shopContainer.innerHTML = `
      <div class="shop-content">
        <div class="shop-header">
          <h2>Quartermaster's Requisition Shop</h2>
          <button id="close-shop" class="menu-button">Close</button>
        </div>
        
        <div class="shop-sections">
          <div class="buy-section">
            <h3>Available Items</h3>
            <div id="shop-buy-items" class="shop-items-grid"></div>
          </div>
          
          <div class="sell-section">
            <h3>Sell Items from Inventory</h3>
            <div id="shop-sell-items" class="shop-items-grid"></div>
          </div>
        </div>
        
        <div class="shop-footer">
          <div class="player-currency">
            Your Taelors: <span id="player-taelors">${window.player.taelors}</span>
          </div>
        </div>
      </div>
    `;
    
    // Add to body
    document.body.appendChild(shopContainer);
    
    // Populate buy section
    const buyItemsContainer = document.getElementById('shop-buy-items');
    this.standardInventory.forEach(item => {
      const itemTemplate = window.itemTemplates[item.templateId];
      if (itemTemplate) {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
          <div class="item-icon ${`rarity-${itemTemplate.rarity.name.toLowerCase()}`}">
            ${itemTemplate.symbol}
          </div>
          <div class="item-details">
            <div class="item-name">${itemTemplate.name}</div>
            <div class="item-description">${item.description}</div>
            <div class="item-price">${item.buyPrice} Taelors</div>
          </div>
          <button class="buy-button" data-template-id="${item.templateId}">Buy</button>
        `;
        
        // Add buy button event
        const buyButton = itemElement.querySelector('.buy-button');
        buyButton.addEventListener('click', () => this.buyItem(item.templateId, item.buyPrice));
        
        buyItemsContainer.appendChild(itemElement);
      }
    });
    
    // Populate sell section with player inventory
    const sellItemsContainer = document.getElementById('shop-sell-items');
    window.player.inventory.forEach(item => {
      const itemTemplate = item.getTemplate();
      const buybackPrice = this.calculateItemBuyback(item);
      
      if (buybackPrice > 0) {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item sellable-item';
        itemElement.innerHTML = `
          <div class="item-icon ${`rarity-${itemTemplate.rarity.name.toLowerCase()}`}">
            ${itemTemplate.symbol}
          </div>
          <div class="item-details">
            <div class="item-name">${itemTemplate.name}</div>
            <div class="item-description">${itemTemplate.description}</div>
            <div class="item-price">${buybackPrice} Taelors</div>
          </div>
          <button class="sell-button" data-instance-id="${item.instanceId}">Sell</button>
        `;
        
        // Add sell button event
        const sellButton = itemElement.querySelector('.sell-button');
        sellButton.addEventListener('click', () => this.sellItem(item.instanceId));
        
        sellItemsContainer.appendChild(itemElement);
      }
    });
    
    // Close button event
    document.getElementById('close-shop').addEventListener('click', () => {
      document.body.removeChild(shopContainer);
    });
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .shop-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .shop-content {
        background: #1e2636;
        border-radius: 8px;
        width: 90%;
        max-width: 1000px;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      }
      
      .shop-sections {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        overflow: auto;
      }
      
      .shop-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 10px;
        max-height: 500px;
        overflow-y: auto;
      }
      
      .shop-item {
        background: #2a3448;
        border-radius: 8px;
        padding: 15px;
        display: flex;
        align-items: center;
        gap: 15px;
        transition: transform 0.3s;
      }
      
      .shop-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
      }
      
      .item-icon {
        font-size: 2em;
        padding: 10px;
        border-radius: 50%;
      }
      
      .buy-button, .sell-button {
        background: #3a4568;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.3s;
      }
      
      .buy-button:hover, .sell-button:hover {
        background: #4a5678;
      }
      
      .buy-button:active, .sell-button:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(styleElement);
  },

  // Buy an item from the shop
  buyItem: function(templateId, price) {
    if (window.player.taelors < price) {
      window.showNotification('Not enough Taelors to purchase!', 'warning');
      return false;
    }
    
    const itemTemplate = window.itemTemplates[templateId];
    if (!itemTemplate) {
      console.error('Invalid item template:', templateId);
      return false;
    }
    
    // Check inventory space
    if (window.player.inventory.length >= window.player.inventoryCapacity) {
      window.showNotification('Inventory is full!', 'warning');
      return false;
    }
    
    // Deduct Taelors and add item
    window.player.taelors -= price;
    window.addItemToInventory(itemTemplate);
    
    // Update Taelors display
    document.getElementById('player-taelors').textContent = window.player.taelors;
    
    return true;
  },

  // Sell an item from player's inventory
  sellItem: function(instanceId) {
    const item = window.player.inventory.find(i => i.instanceId === instanceId);
    if (!item) {
      console.error('Item not found in inventory');
      return false;
    }
    
    const sellPrice = this.calculateItemBuyback(item);
    
    // Remove item from inventory
    window.removeItemFromInventory(instanceId);
    
    // Add Taelors
    window.player.taelors += sellPrice;
    
    // Update Taelors display
    document.getElementById('player-taelors').textContent = window.player.taelors;
    
    // Show confirmation
    window.showNotification(`Sold ${item.getName()} for ${sellPrice} Taelors`, 'success');
    
    // Refresh sell items list
    document.getElementById('shop-sell-items').innerHTML = '';
    window.player.inventory.forEach(invItem => {
      const itemTemplate = invItem.getTemplate();
      const buybackPrice = this.calculateItemBuyback(invItem);
      
      if (buybackPrice > 0) {
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item sellable-item';
        itemElement.innerHTML = `
          <div class="item-icon ${`rarity-${itemTemplate.rarity.name.toLowerCase()}`}">
            ${itemTemplate.symbol}
          </div>
          <div class="item-details">
            <div class="item-name">${itemTemplate.name}</div>
            <div class="item-description">${itemTemplate.description}</div>
            <div class="item-price">${buybackPrice} Taelors</div>
          </div>
          <button class="sell-button" data-instance-id="${invItem.instanceId}">Sell</button>
        `;
        
        // Add sell button event
        const sellButton = itemElement.querySelector('.sell-button');
        sellButton.addEventListener('click', () => this.sellItem(invItem.instanceId));
        
        document.getElementById('shop-sell-items').appendChild(itemElement);
      }
    });
    
    return true;
  }
};

// Add Quartermaster to action buttons
window.addQuartermasterToActions = function() {
  console.log("Attempting to add Quartermaster button");
  
  // Ensure actions container exists and game is in main game state
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) {
    console.error("Actions container not found!");
    return;
  }
  
  // Check if button already exists
  if (document.getElementById('quartermaster-btn')) {
    console.log("Quartermaster button already exists");
    return;
  }
  
  const quartermasterButton = document.createElement('button');
  quartermasterButton.id = 'quartermaster-btn';
  quartermasterButton.className = 'action-btn';
  quartermasterButton.textContent = 'Quartermaster';
  quartermasterButton.onclick = function() {
    window.QuartermasterSystem.openShop();
  };
  
  console.log("Adding Quartermaster button to actions");
  actionsContainer.appendChild(quartermasterButton);
};

// Modify the existing updateActionButtons to include Quartermaster
const originalUpdateActionButtons = window.updateActionButtons;
window.updateActionButtons = function() {
  // Call original function first
  originalUpdateActionButtons.call(this);
  
  // Then add Quartermaster button
  window.addQuartermasterToActions();
};

// Multiple ways to ensure button appears
window.addEventListener('DOMContentLoaded', function() {
  window.addQuartermasterToActions();
});

// Additional check for game initialization
if (window.initializeGame) {
  const originalInitializeGame = window.initializeGame;
  window.initializeGame = function() {
    originalInitializeGame.call(this);
    window.addQuartermasterToActions();
  };
}

// Manual check for those who might want to add it programmatically
window.forceAddQuartermasterButton = function() {
  console.log("Forcing Quartermaster button addition");
  const actionsContainer = document.getElementById('actions');
  if (actionsContainer && !document.getElementById('quartermaster-btn')) {
    window.addQuartermasterToActions();
  }
};
