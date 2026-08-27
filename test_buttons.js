// PASTE THIS IN BROWSER CONSOLE TO TEST IF BUTTONS EXIST
// Press F12 → Console tab → Paste this code

console.log('🔍 Checking for Join Meeting buttons...');

// Check if buttons exist
const buttons = document.querySelectorAll('button');
console.log(`Total buttons on page: ${buttons.length}`);

// Find meeting-related buttons
const meetingButtons = Array.from(buttons).filter(btn => 
  btn.textContent.includes('Join Meeting') || 
  btn.textContent.includes('Invite to Meeting')
);

console.log(`Meeting buttons found: ${meetingButtons.length}`);

meetingButtons.forEach((btn, index) => {
  console.log(`Button ${index + 1}:`, {
    text: btn.textContent.trim(),
    disabled: btn.disabled,
    className: btn.className,
    clickable: window.getComputedStyle(btn).pointerEvents !== 'none'
  });
});

if (meetingButtons.length === 0) {
  console.log('❌ NO MEETING BUTTONS FOUND!');
  console.log('Possible reasons:');
  console.log('1. You are not in the "Active" tab');
  console.log('2. No swaps with status="ACCEPTED"');
  console.log('3. Page not fully loaded');
  console.log('\nTry: Click the "Active" tab in Swap Center');
} else {
  console.log('✅ Buttons exist! Checking if clickable...');
  
  // Test if button can be clicked
  const firstButton = meetingButtons[0];
  if (firstButton.disabled) {
    console.log('❌ Button is DISABLED');
  } else if (window.getComputedStyle(firstButton).pointerEvents === 'none') {
    console.log('❌ Button has pointer-events: none (CSS blocking clicks)');
  } else {
    console.log('✅ Button should be clickable!');
    console.log('If clicking does nothing, check console for errors when you click');
  }
}
