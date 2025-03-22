document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("clickMe");
  const message = document.getElementById("message");
  let clickCount = 0;

  button.addEventListener("click", () => {
    clickCount++;
    message.textContent = `You clicked the button ${clickCount} time${
      clickCount === 1 ? "" : "s"
    }!`;
    message.style.color = `hsl(${clickCount * 50}, 70%, 50%)`;
  });
});
