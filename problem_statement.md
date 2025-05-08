Thought for 5 seconds
### 📝 FlexFit – Problem Statement


#### What problem does the application solve?

Most workout apps push a one-size-fits-all routine: beginners drop out because the first sessions are too intense, while intermediates plateau because the plan ignores real-time fatigue. FlexFit creates a **7-day training plan that re-optimises itself after every completed session**, so difficulty always matches the user’s current capacity.

---

#### Main functionality

* **Sport-type selection** – user chooses *Strength, HIIT, Yoga/Mobility,* or *Running Intervals*.
* **Adaptive weekly plan** – Day 0 plan is generated; after each session the remaining days are recalculated based on the user’s feedback.
* **Voice-guided sets** – each exercise is announced via on-device text-to-speech with a short coaching cue.
* **Effort feedback** – user rates perceived exertion (RPE 1–10) and, for cardio, the app can count foot-strikes via the phone microphone.
* **Progress tracking** – graphs for total volume, average RPE, and consistency streaks.

---

#### Intended users

* **True beginners** who need gentle, confidence-building progressions.
* **Busy professionals** looking for efficient 10-minute HIIT or mobility sessions.
* **Rehab / postpartum athletes** who must scale load cautiously day-to-day.

---

#### Meaningful GenAI integration

* **RAG exercise retrieval** – a Weaviate vector store (\~1 500 labelled exercises) returns candidates that match the chosen sport type, muscle group, and equipment constraints.
* **Adaptive reasoning** – GPT-4o (cloud) or local Phi-3 mini weighs last-session RPE, muscle-group rotation, and weekly volume goals to select the next exercise, rep/time prescription, and voice script.
* **Safety guardrails** – rule-based post-filter blocks exercises that exceed safe intensity jumps or contain contraindicated poses.
* **Metrics** – latency and token counters exposed for Prometheus / Grafana.

---

#### Usage scenarios

* **Strength – Beginner:** Melis picks *Strength • Full-Body Beginner*. FlexFit voices “Body-weight squats, 12 reps.” Melis rates effort 3/10 → the system ups the next set slightly and increases lunges later in the week.
* **HIIT – Busy schedule:** Ada selects *HIIT • 8-min Tabata*. Mic cadence shows fatigue; GenAI swaps high-knees for mountain-climbers mid-session to keep RPE near 7.
* **Mobility – Recovery:** Arda chooses *Yoga/Mobility • Lower-back relief*. After two hard poses Arda rates RPE 8; the plan inserts Child’s Pose recovery and reduces hold times for the remaining session.


