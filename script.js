// script.js - This file is for any JavaScript functionality.

document.addEventListener('DOMContentLoaded', () => {
    console.log("Portfolio website loaded successfully!");

    // Smooth scroll for internal navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // --- Intersection Observer for Scroll Animations ---
    const animateElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Optional: Stop observing after it becomes visible if you only want the animation once
                // observer.unobserve(entry.target);
            } else {
                // Optional: Remove 'is-visible' if you want the animation to re-trigger on scroll back up
                // entry.target.classList.remove('is-visible');
            }
        });
    }, {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: "0px 0px -50px 0px" // Adjust the viewport bottom margin for earlier/later trigger
    });

    animateElements.forEach(element => {
        observer.observe(element);
    });


    // --- Gemini API Integration Logic ---
    const askAiButton = document.getElementById('askAiButton');
    const aiQuestionInput = document.getElementById('aiQuestionInput');
    const aiResponseDiv = document.getElementById('aiResponse');
    const aiLoadingSpinner = document.getElementById('aiLoadingSpinner');

    askAiButton.addEventListener('click', async () => {
        const userQuestion = aiQuestionInput.value.trim();
        if (!userQuestion) {
            aiResponseDiv.textContent = "Please enter a question.";
            return;
        }

        // Show loading spinner and clear previous response
        aiResponseDiv.innerHTML = '<div class="spinner"></div>';
        aiLoadingSpinner.classList.remove('hidden');
        askAiButton.disabled = true;

        try {
            // Extract portfolio content dynamically
            const aboutContent = document.getElementById('about').innerText;
            // For skills, now we can directly get text from the skill-item divs
            const skillsContent = Array.from(document.querySelectorAll('#skills .skill-item')).map(item => item.textContent.trim()).join(', ');
            const projectsContent = Array.from(document.querySelectorAll('#projects .project-card')).map(card => {
                const title = card.querySelector('h3').textContent.trim();
                const description = card.querySelector('p').textContent.trim();
                return `Project: ${title}\nDescription: ${description}`;
            }).join('\n\n');

            const portfolioContext = `
                ---PORTFOLIO CONTENT START---
                About Me:
                ${aboutContent}

                Skills:
                ${skillsContent}

                Projects:
                ${projectsContent}
                ---PORTFOLIO CONTENT END---
            `;

            const prompt = `
                You are an AI assistant representing the portfolio of a Full Stack Web Developer named Your Name.
                Your Name's portfolio information is provided below.

                ${portfolioContext}

                A visitor has a question for you. Please answer their question concisely and professionally, strictly based on the provided portfolio content. If the question cannot be answered from the provided information, politely state that you only have information about the developer's portfolio. Do not invent information.

                Visitor's Question: ${userQuestion}
            `;

            let chatHistory = [];
            chatHistory.push({ role: "user", parts: [{ text: prompt }] });

            const payload = { contents: chatHistory };
            const apiKey = ""; // Canvas will provide this at runtime
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                aiResponseDiv.textContent = text;
            } else {
                aiResponseDiv.textContent = "Sorry, I couldn't generate a response. Please try again.";
                console.error("Gemini API response structure unexpected:", result);
            }

        } catch (error) {
            aiResponseDiv.textContent = "An error occurred while fetching the AI response. Please try again later.";
            console.error("Error calling Gemini API:", error);
        } finally {
            aiLoadingSpinner.classList.add('hidden');
            askAiButton.disabled = false;
        }
    });
});
