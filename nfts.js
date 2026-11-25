(() => {
  "use strict";
  const cards = Array.from(document.querySelectorAll(".nft-flip-card"));
  const artworks = Array.from({length:6}, (_,i) => "./assets/images/NFTs/NFT-0" + (i+1) + ".png");
  if (!cards.length) return;
  function reveal(card) {
    const image = card.querySelector(".nft-reveal-image");
    const current = image.dataset.artwork || "";
    const choices = artworks.filter(src => src !== current);
    const next = choices[Math.floor(Math.random() * choices.length)];
    image.src = next;
    image.dataset.artwork = next;
    const match = next.match(/NFT-(\d+)\.png$/);
    const number = match ? match[1] : "??";
    image.alt = "NOT YOUR MONEY collectible NFT " + number;
    card.classList.add("is-revealed");
    card.setAttribute("aria-pressed", "true");
    card.setAttribute("aria-label", "Revealed NFT " + number + ". Tap to shuffle the reveal");
  }
  cards.forEach(card => {
    card.addEventListener("pointerenter", event => { if (event.pointerType === "mouse") reveal(card); });
    card.addEventListener("focus", () => reveal(card));
    card.addEventListener("click", () => reveal(card));
  });
})();