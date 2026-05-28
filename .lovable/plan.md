I will fix only the JBJ Broker Academy visual issues you called out.

Plan:
1. Restore the academy header KPI boxes
   - Bring back the richer previous style for the three boxes: Library books, Training modules, Your training.
   - Make them premium colored/highlighted panels again, not plain flat white boxes.
   - Keep the current labels and data, but restore the stronger visual hierarchy.

2. Restore the training modules visual style
   - Rework the Training Modules cards back toward the earlier highlighted academy style.
   - Remove the plain framed-card feeling and make the cards feel intentional, premium, and consistent with the academy page.

3. Lock one book-cover system for every broker academy book
   - Use the Digital Marketing for Real Estate / No. 14 cover as the master style.
   - Apply the exact same cover layout to every broker academy book: same black marble base, same gold border system, same straight 3D book shape, same left spine/page-depth effect, same number badge position/style, same JBJ mark/title/footer composition.
   - Only change the book title, number, and subtitle/category text per book.
   - Stop switching styles by learning path/category so all books look like one consistent collection.

4. Remove the unwanted white framed-book effect
   - Make the book itself show as the full object, straight to the screen.
   - Avoid a white outer picture-frame/card around the cover.
   - Keep only realistic 3D page-edge/spine depth, matching the correct reference.

5. Apply the same book system everywhere it is reused
   - Broker Academy library cards.
   - Any shared library/guide book cover component using the current PremiumBookCover/BookCoverFace system, so future books do not drift into different styles again.

6. Validate visually and technically after implementation
   - Inspect the academy page at the current viewport.
   - Confirm all visible books use the same Digital Marketing / No. 14 style.
   - Confirm KPI boxes and Training Modules restored to premium highlighted styling.
   - Run the relevant static/type validation signal available in the environment before reporting completion.

Technical files to update:
- `src/components/books/PremiumBookCover.tsx`
- `src/components/broker-education/Book3DCard.tsx`
- `src/components/books/BookCoverFace.tsx`
- `src/pages/broker/BrokerLearning.tsx`