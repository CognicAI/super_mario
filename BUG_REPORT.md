# Bug and Error Report - Super Mario Quiz Quest

**Generated:** January 14, 2026  
**Project:** Super Mario Quiz Quest  
**Scan Type:** Comprehensive Code Analysis

---

## Executive Summary

Total Issues Found: **10**
- 🔴 Critical Bugs: **3**
- 🟠 High Priority: **3**
- 🟡 Medium Priority: **3**
- 🟢 Low Priority: **1**

---

## 🔴 Critical Bugs

### 1. **API Key Exposure and Build Failure**
**File:** [services/geminiService.ts](services/geminiService.ts#L6)  
**Severity:** Critical  
**Type:** Security & Runtime Error

**Issue:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

**Problems:**
- `process.env` is not available in browser environments
- Vite uses `import.meta.env` instead of `process.env`
- Environment variable should be prefixed with `VITE_` to be accessible
- API key will be `undefined`, causing the Gemini API to fail

**Impact:**
- API calls will always fail
- Application cannot fetch questions from AI
- Users will only see fallback questions

**Fix Required:**
```typescript
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
```

**Additional Steps:**
- Create `.env` file with `VITE_API_KEY=your_key_here`
- Add `.env` to `.gitignore` to prevent API key exposure
- Update documentation for environment setup

---

### 2. **Incorrect Gemini Model Name**
**File:** [services/geminiService.ts](services/geminiService.ts#L12)  
**Severity:** Critical  
**Type:** Runtime Error

**Issue:**
```typescript
model: 'gemini-3-flash-preview',
```

**Problems:**
- Model name `gemini-3-flash-preview` does not exist
- This will throw an API error
- Correct model names are: `gemini-2.0-flash-exp`, `gemini-1.5-flash`, `gemini-1.5-pro`, etc.

**Impact:**
- All API requests will fail
- No questions can be generated
- Game becomes unplayable

**Fix Required:**
```typescript
model: 'gemini-2.0-flash-exp', // or 'gemini-1.5-flash'
```

---

### 3. **Race Condition in Life Decrement Logic**
**File:** [App.tsx](App.tsx#L277-L291)  
**Severity:** Critical  
**Type:** Logic Bug

**Issue:**
```typescript
setLives(prev => {
  const nextLives = prev - 1;
  if (nextLives <= 0) {
    setGameState(GameState.GAMEOVER);
  } else {
    player.pos = { x: 100, y: 450 };
    player.vel = { x: 0, y: 0 };
    audioService.playIncorrect();
  }
  return nextLives;
});
```

**Problems:**
- Multiple simultaneous damage sources (enemy collision + pit fall) can occur
- No invincibility frames after taking damage
- Player can lose multiple lives in a single frame
- State updates inside `setLives` callback can cause inconsistencies

**Impact:**
- Player can instantly die from full health
- Unfair gameplay experience
- Game becomes frustrating

**Fix Required:**
- Add invincibility timer after taking damage
- Prevent multiple damage sources from firing simultaneously
- Extract position reset logic outside state setter

---

## 🟠 High Priority Issues

### 4. **Unsafe Audio Context Usage**
**File:** [services/audioService.ts](services/audioService.ts#L55-L58)  
**Severity:** High  
**Type:** Logic Error

**Issue:**
```typescript
playCorrect() {
  const now = this.ctx?.currentTime || 0;
  // Arpeggio
  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
    setTimeout(() => this.playTone(f, 'square', 0.1, 0.05), i * 100);
  });
}
```

**Problems:**
- `now` variable is declared but never used
- `setTimeout` is used instead of scheduling with AudioContext time
- Can cause timing issues and audio glitches
- Not using the Web Audio API properly

**Impact:**
- Audio timing can be inaccurate
- Performance issues with multiple sounds
- Audio may not sync with game state

**Fix Required:**
```typescript
playCorrect() {
  [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
    setTimeout(() => this.playTone(f, 'square', 0.1, 0.05), i * 100);
  });
}
```

---

### 5. **Pit Fall Safety Code Creates Teleportation Bug**
**File:** [App.tsx](App.tsx#L314-L318)  
**Severity:** High  
**Type:** Logic Bug

**Issue:**
```typescript
// Temporary safety to prevent infinite loop
player.pos.y = CANVAS_HEIGHT - player.height - TILE_SIZE;
player.vel.y = 0;
player.grounded = true;
```

**Problems:**
- After falling into a pit, player is teleported back up
- This happens AFTER life is already decremented
- Creates confusing behavior where player loses a life but stays on screen
- Comment says "temporary" but it's in production code
- Can cause infinite life loss if player gets stuck

**Impact:**
- Player experiences jarring teleportation
- Can lose all lives while standing still
- Breaks game flow

**Fix Required:**
- Remove safety code
- Ensure player is properly reset before next frame
- Or add a respawn timer before returning player to starting position

---

### 6. **Missing TypeScript Type Definitions**
**File:** [services/audioService.ts](services/audioService.ts#L4)  
**Severity:** High  
**Type:** Type Safety

**Issue:**
```typescript
this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
```

**Problems:**
- Using `any` type bypasses TypeScript safety
- Should declare proper types for webkit prefixed API
- No null checks when using `this.ctx`

**Impact:**
- Runtime errors in browsers without AudioContext
- Type safety is compromised
- Harder to catch errors during development

**Fix Required:**
```typescript
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

private init() {
  if (!this.ctx) {
    const AudioContextClass = window.AudioContext || 
      (window as WindowWithWebkit).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported');
      return;
    }
    this.ctx = new AudioContextClass();
  }
  if (this.ctx.state === 'suspended') {
    this.ctx.resume();
  }
}
```

---

## 🟡 Medium Priority Issues

### 7. **Unused Variable in Audio Service**
**File:** [services/audioService.ts](services/audioService.ts#L55-L65)  
**Severity:** Medium  
**Type:** Code Quality

**Issue:**
Both `playCorrect()` and `playIncorrect()` methods declare `now` variable but never use it:
```typescript
const now = this.ctx?.currentTime || 0;
```

**Impact:**
- Dead code
- Confusing for maintainers
- Indicates incomplete refactoring

**Fix Required:**
Remove the unused variable declarations.

---

### 8. **No Error Handling for Canvas Context**
**File:** [App.tsx](App.tsx#L488-L495)  
**Severity:** Medium  
**Type:** Error Handling

**Issue:**
```typescript
const loop = useCallback(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  update();
  draw(ctx);
  requestRef.current = requestAnimationFrame(loop);
}, [update, draw]);
```

**Problems:**
- If canvas context fails to create, animation loop silently stops
- No error message to user
- Application appears frozen

**Impact:**
- Poor user experience
- Hard to debug issues
- No fallback behavior

**Fix Required:**
Add error logging and user notification when canvas fails to initialize.

---

### 9. **Missing .gitignore File**
**File:** Project Root  
**Severity:** Medium  
**Type:** Configuration

**Issue:**
No `.gitignore` file detected in the workspace structure.

**Problems:**
- `node_modules/` could be committed to git
- `.env` file with API keys could be exposed
- Build artifacts (`dist/`) could be tracked
- IDE files could clutter repository

**Impact:**
- Repository bloat
- Security risk (API key exposure)
- Merge conflicts with dependencies

**Fix Required:**
Create `.gitignore` with:
```
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.vscode/
```

---

## 🟢 Low Priority Issues

### 10. **Hard-coded String Values**
**File:** [components/GameUI.tsx](components/GameUI.tsx#L26)  
**Severity:** Low  
**Type:** Code Quality

**Issue:**
```typescript
const [topic, setTopic] = React.useState('General Science');
```

**Problems:**
- Default topic is hard-coded
- No validation for empty topic input
- Could be moved to constants file

**Impact:**
- Minor usability issue
- Harder to maintain/change defaults

**Fix Required:**
- Move to constants file
- Add input validation
- Consider using localStorage for last used topic

---

## Summary of Required Actions

### Immediate Actions (Must Fix Before Deployment)
1. ✅ Fix environment variable usage in geminiService.ts
2. ✅ Correct the Gemini model name
3. ✅ Add invincibility frames to prevent multi-hit deaths

### Short-term Actions (Fix Soon)
4. ✅ Remove unused variables in audioService
5. ✅ Fix pit fall teleportation logic
6. ✅ Add proper TypeScript types for WebKit audio
7. ✅ Create .gitignore file
8. ✅ Add error handling for canvas initialization

### Long-term Improvements
9. ✅ Refactor audio timing to use AudioContext scheduling
10. ✅ Move hard-coded values to constants

---

## Testing Recommendations

1. **Test API Integration**: Verify Gemini API works with correct model name and API key
2. **Test Damage System**: Ensure player only loses one life at a time
3. **Test Pit Falls**: Verify proper respawn behavior
4. **Test Audio**: Check all sound effects play correctly across browsers
5. **Test Environment Setup**: Verify app works with fresh installation

---

## Additional Notes

- The application has a solid architecture overall
- Most issues are configuration and edge-case bugs
- No critical memory leaks or performance issues detected
- Code is generally well-structured and readable

**Recommendation:** Address critical bugs (1-3) immediately before any production deployment. The app is currently non-functional due to API integration issues.
