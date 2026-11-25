(() => {
  "use strict";
  const cards = Array.from(document.querySelectorAll(".mystery-card"));
  const artPaths = Array.from({length:6}, (_,i) => "./assets/images/NFTs/NFT-0" + (i+1) + ".png");
  const touchMode = window.matchMedia("(hover: none), (pointer: coarse)").matches;

  function chooseRandomArt(image) {
    const current = image.dataset.artPath || "";
    const options = artPaths.filter(path => path !== current);
    const chosen = options[Math.floor(Math.random() * options.length)];
    image.src = chosen;
    image.dataset.artPath = chosen;
    const number = chosen.match(/NFT-(\d+)\.png$/)?.[1] || "";
    image.alt = "NOT YOUR MONEY collectible NFT " + number;
    return number;
  }

  cards.forEach(card => {
    const art = card.querySelector(".mystery-card__art");
    let revealed = false;

    if (!touchMode) {
      card.addEventListener("pointerenter", event => {
        if (event.pointerType !== "mouse") return;
        chooseRandomArt(art);
      });
      card.addEventListener("focus", () => chooseRandomArt(art));
    }

    card.addEventListener("click", () => {
      if (!touchMode) return;
      if (!revealed) {
        const number = chooseRandomArt(art);
        card.setAttribute("aria-label", "NFT " + number + " revealed. Tap to hide.");
        card.setAttribute("aria-pressed", "true");
        card.classList.add("is-revealed");
      } else {
        card.setAttribute("aria-label", "Mystery NFT card. Tap to reveal.");
        card.setAttribute("aria-pressed", "false");
        card.classList.remove("is-revealed");
      }
      revealed = !revealed;
    });
  });
})();