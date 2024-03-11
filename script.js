// Define an array of animals
const animals = ['dog', 'cat', 'bear'];

// Function to display a random animal
function displayRandomAnimal() {
    // Generate a random index to select an animal from the array
    const randomIndex = Math.floor(Math.random() * animals.length);
    const randomAnimal = animals[randomIndex];

    // Update the content of the HTML element with the random animal
    const animalDisplayElement = document.getElementById('animal-display');
    animalDisplayElement.textContent = 'Random Animal: ' + randomAnimal;
}

// Initial call to display a random animal
displayRandomAnimal();

// Set up an interval to display a random animal every minute
setInterval(displayRandomAnimal, 6000); // 60 seconds * 1000 milliseconds
