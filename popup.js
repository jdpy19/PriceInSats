let priceInSatsButton = document.getElementById("priceInSats");

priceInSatsButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPriceToSats,
  });
});

// The body of this function will be executed as a content script inside the
// current page
async function setPriceToSats() {
  function replacePriceWithSats(inputText, bitcoinPrice) {
    const re = /(\$[\d\,]+\.?\d{0,2})/g
    let matches = inputText.match(re)
    if (matches && bitcoinPrice) {
      for (key in matches) {
        let replacement = dollarsToSats(cleanPriceToFloat(matches[key]), bitcoinPrice) + ' sats'
        inputText = inputText.replace(matches[key], replacement);
      }
    }
    return inputText
  }

  function cleanPriceToFloat(price) {
    const re = /[^0-9.-]+/g
    return Number(price.replace(re, ''))
  }

  async function getBitcoinPrice() {
    let response = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json')
    let data = await response.json();
    console.log(data.bpi.USD.rate_float)
    return data.bpi.USD.rate_float
  }

  function dollarsToSats(amount, bitcoinPrice) {
    return Math.round(amount / bitcoinPrice * 100000000);
  }

  function searchForChildrenRecursively(parent, bitcoinPrice) {
    const bad_types = ['style', 'script'];
    let children = parent.children;
    if (children.length > 0) {
      for (let key in children) {
        if (children[key].children) {
          if (!bad_types.includes(children[key].tagName.toLowerCase())) {
            searchForChildrenRecursively(children[key], bitcoinPrice);
          }
        }
      }
    } else {
      if (parent.innerText) {
        parent.innerText = replacePriceWithSats(parent.innerText, bitcoinPrice);
      }
    }
  }
  const bitcoinPrice = await getBitcoinPrice()
  searchForChildrenRecursively(document.body, bitcoinPrice);
}




