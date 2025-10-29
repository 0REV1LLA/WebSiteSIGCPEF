/* const container= document.querySelector(".container"),
    registerBtn= document.querySelector(".register-btn"),
    loginBtn= document.querySelector(".login-btn");

registerBtn.addEventListener("click", () => {
    container.classList.add("active");
})

loginBtn.addEventListener("click", () => {
    container.classList.remove("active");
}) */

const container= document.querySelector(".container");
const changeFormBtn= document.querySelectorAll(".change-form");

changeFormBtn.forEach(element => {
    element.addEventListener("click", () => {
        container.classList.toggle("active");
    })
});