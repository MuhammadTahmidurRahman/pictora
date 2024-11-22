// Navigation function with additional logging and error handling
function navigateTo(page) {
  if (!page) {
    console.error("Error: No page specified for navigation.");
    return;
  }

  try {
    console.log(`Navigating to: ${page}`);
    window.location.href = page;
  } catch (error) {
    console.error("Navigation failed:", error);
  }
}
