This should be a sentence cloze based language learning app.

The learning data in general is stored in public/cloze-drill-data.

We need one page where the learner can choose the language they want to learn, based on @public/cloze-drill-data/index.json. KISS!!

Then, within that, we need a view for the learner to select a lesson (another simply daisyui card grid), based again on the data, e.g. @public/cloze-drill-data/vie/index.json or @public/cloze-drill-data/deu/index.json.

Then, starting the lesson should take us to a practice screen, picking exercises from the data. Some notes:

- Use ts-fsrs (yes, ACTUALLY ts-fsrs) and dexie (according to @agents.md, ACTUALLY READ THAT FILE!!!) to track learner progress
- With 85% chance, prefer learning a seen+due exercise (according to ts-fsrs), otherwise an unseen one. Fall back to the other type if the preferred isn't available. When none due and none unseen, show a screen communicating this, and allow either going back to lesson practice or do "infinite practice", which means we allow just showing the exercises with the lowest due date (even if it's in the future), so the user can practice the lesson as much as they want
- when the lesson data has exercises directly in its main array, like @public/cloze-drill-data/deu/data/usage-als-wie.json, you may pick any of them at any time (following the 85% rule above)
- when the lesson data has arrays of exercises in its array
    - if they are `ordered`, like in @public/cloze-drill-data/vie/data/fun-idioms.json, that means when we pick from an exercise array, we may only pick them in order, as in: the second exercise may only be picked if the first one is seen+not-due (according to fsrs). The third exercise may only be picked if BOTH the 1st and the 2nd are seen+not-due (and so on)
    - if they are `ordered=false`, like in @public/cloze-drill-data/vie/data/short-sentences-common-words.json, that means we can pick from within the exercise array randomly. However, that makes the other exercises in the array "hot". the "hot pool" is an ephemeral colleciton of exercises. Exercises may be added in there in this scenario when they are either new or seen+not-due. They stay in there for 4 exercises, tracked individually. Then, when the algo picks a new exercise, first decide whether new or due is prefferred (as described above), then with 30% chance prefer to pick an exercise from the hot pool. Save the hot pool within session and don't overengineer, this is just a heuristic so that material is reinforced with similar material. Exercices shown (in any fasion) means they'll be removed from the hot pool
- track exercises by a compound key of language+lesson+main. This is unique.
- Q/A flow:
    - add some basic decent juicy animations to all of the following
    - the question may be comprised out of `top`, `main` (always), and `bottom`. Render these NICELY (not by spamming UI widgets around, by cleanly using tailwind+daisy)
    - if we have answer options like in @public/cloze-drill-data/deu/data/usage-als-wie.json, display these as big daisy buttons in randomized order. When the user presses the wrong button (the first array item is always the correct ones), disable the wrong button (so the user must click on the right answer) and record as `Wrong`. When the right answer is clicked, hide the buttons replace the "＿" in `main` with the clicked correct answer (highlighting the answer in the string), wait 0.5 seconds, and go the next exercise. If it was the first click, score as `Correct`
    - if we just have a single answer, like in @public/cloze-drill-data/vie/data/fun-idioms.json, treat it like a user-scored flashcard. First, show only top/main/bottom + a "Reveal" button. Once that's clicked, either do an replacement like above if we have an `answer` prop, or if we just have `reveal`, show a <hr> and the `reveal` below this. In either case, below that, show two buttons "Wrong" and "Correct", and score accordingly 


STICK TO @agents.md!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
Keep the UI lean, do NOT!!!! excessively spam wrappers and labels and cute badges