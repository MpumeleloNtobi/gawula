# Agent-Participant Workshop Synthesis

## Caveat

This was a simulated workshop with agent participants. It is useful for product rehearsal, hypothesis generation, and prototype direction. It is not real customer evidence.

## Participant Set

1. Solo frequent user in Johannesburg.
2. Household orderer in Midrand.
3. Office lunch coordinator in Sandton.
4. Student/social group user in Braamfontein.
5. Deal-sensitive user in Pretoria.
6. Support-frustrated user in Cape Town.
7. User with mobility constraints in Durban.
8. Food-court/mall user in Rosebank.

## Strongest Signals

1. Add forgotten items before the order locks appeared in all 8 participant rankings.
2. Accurate ETA appeared in 7 of 8 participant rankings.
3. Easier refunds appeared in 6 of 8 participant rankings.
4. Clearer fees appeared in 5 of 8 participant rankings.
5. Cheaper delivery appeared in 4 of 8 participant rankings.
6. Group ordering and one-basket multi-store ordering were strongest in specific segments, not universal.

## Ranked Feature Demand

| Feature | Top-5 mentions | Signal |
| --- | ---: | --- |
| Add forgotten items before lock | 8 | Universal, immediate, low-friction need |
| Accurate ETA | 7 | Trust and planning need |
| Easier refunds | 6 | Trust and support need |
| Clearer fees | 5 | Checkout confidence need |
| Cheaper delivery | 4 | Price sensitivity need |
| Better driver contact | 2 | Important for buildings, campuses, accessibility |
| Group order from different stores | 2 | Strong for office/student segments |
| One basket for multiple stores | 2 | Strong for food-court and accessibility segments |
| Restaurant accountability | 2 | Strong after missing/wrong items |
| Promos/bundles | 1 | Deal-sensitive segment |
| Delivery proof | 1 | Very high for support-frustrated segment despite low count |
| Mixed-meal reorder | 0 | No clear pull in this run |

## Concept Reactions

### Complete Your Meal

Broadest appeal. Participants liked practical add-ons such as drinks, dessert, sauce, sides, snacks, water, milk, medicine, or essentials. The concern was that it must not feel like random upselling.

Best use cases:

1. Add drinks or dessert before checkout.
2. Remind users about sauces or sides.
3. Add household essentials when ordering food.
4. Avoid a second delivery fee for a small item.

### Everyone Gets What They Want

Strong for households, offices, students, and social groups. Less relevant for solo users. The biggest need is payment splitting, deadlines, and reducing coordinator admin.

Best use cases:

1. Office lunch links.
2. Student group orders.
3. Family orders with different preferences.
4. Each person adding and paying for their own items.

### One Basket Across Stores

Most exciting to the food-court participant and user with mobility constraints. Other participants were interested but cautious. Main concerns were extra fees, cold food, one slow store delaying everything, and support complexity.

Best use cases:

1. Same food court or same hub.
2. Main meal plus drink/dessert from another store.
3. Food plus a small convenience essential.
4. Pickup or delivery where store proximity is obvious.

### Protected Delivery

This is less of a growth feature and more of a trust requirement. It matters most when something goes wrong. Participants wanted proof, clear responsibility, and fast support.

Best use cases:

1. Missing items.
2. Wrong items.
3. Marked delivered but not received.
4. Office/reception handoff.
5. Driver unable to find complex, campus, or building entrance.

## Language Bank

1. "Let me add something before it's too late."
2. "Show me the real delivery time, not the optimistic one."
3. "Don't make me pay two delivery fees for one meal."
4. "If something is missing, refund me without making it a whole case."
5. "I want everyone fed without turning supper into admin."
6. "Let everyone add their own lunch and pay their own part."
7. "Show me the real total before I get emotionally committed."
8. "I need one order, not three separate deliveries."
9. "I want to order like I'm standing in the food court, but from my phone."
10. "If the restaurant keeps missing items, the app should do something about it."

## Product Interpretation

The strongest customer language is not technical multi-store ordering. The stronger framing is meal completion, order flexibility, and trust.

The user problem is:

> I want to complete or fix the whole meal without starting another expensive order or fighting support.

The product wedge should be:

> Complete your order before it locks.

## Recommended V1 Direction

Build a same-hub meal-completion prototype before a full multi-store marketplace promise.

V1 scope:

1. Add forgotten items before prep lock.
2. Complete-your-meal suggestions before checkout.
3. Same-hub add-ons from a second store, capped at 2 stores.
4. Store-grouped cart with one total.
5. Clear fee impact before adding the second store.
6. Honest timing message if the second store adds delay.
7. Basic per-store issue reporting in checkout/order summary.

Do not launch the headline as "multi-store ordering" yet. Test customer-facing language around:

1. Complete your order.
2. One basket for the whole meal.
3. Add drinks, dessert, or essentials before checkout.
4. Everyone gets what they want.

## Prototype Metrics

1. Add-on impression to add rate.
2. Forgotten-item add rate.
3. Second-store add rate.
4. Checkout conversion after second-store add.
5. Average order value lift.
6. Delivery-fee objection rate.
7. ETA-delay objection rate.
8. Support concern rate.
9. Repeat intent.
10. Switch intent from Uber Eats or Mr D.

## Decision

Proceed with a meal-completion prototype. Treat full multi-store ordering as the underlying capability, not the first customer-facing headline.