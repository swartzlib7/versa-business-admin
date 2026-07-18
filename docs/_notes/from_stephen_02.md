Please ensure the following with the 3D element (definitions are in brackets [] - let's add a Glossary of Terms also):

- Add a expand toggle so it exands into a lightbox that is more full-screen, but not F11.
- Ensure labels always point to camera.
- `Organization` is the center circle zone. We may need to have a flat label along the edge of the circle (let's try that).
- `Versa AGi` replaces `Northstar Works`.
- The inner circle where we have the spheres for Sales, Production and Accounting changes as follow:
-- Executive (center), Communications (left of center), Dissemination (right of center), Treasury (back), Production (front), Qualification (bottom).
- The second circle represent the `Collaboration` zone.
-- Here we have Vendor [AKA Service Provider] (right), Customer [Person or Business] (front), Partner [Business or Investor] (left), Branch [Subsidiary] (back) - check if I might be missing anything conceptual here and let me know your thoughts.
- The third circle represent the `Environmental` zone. Here we have Locations [Global Address Book] (left), Events [Planned activity that is in the future or already in the past] (right), Knowledge [Documents, recordings, photos, policies, research data etc.] (back), Schedules [An agreement of when an Event, Activity or Task will occur - Time and Date (like a calendar)] (front), Product [Physical object such as a device, manufactured item or computer file] (bottom), Service [Faculty through which results are achieved such as Analysis & Design or Book Keeping] (top).

I think this will be the ERD for our system.

Our current elementsare reorganized as follow:
- Integrations (Product / Integrations)
- Projects (Executive / Projects)
- Tasks (Executive / Projects / Tasks)
- Settings (as is)
- Users (as is)
- Dashboard (as is)

`Active Agents`, `Agent Status` falls away.

This is a key document to iterate over and ensure we use as a keystone for design and clarification.

The way I envision the system working is a UI pattern for each circle - Environment, Collaboration and Organization. Each UI will have a set of regions to configure and connect each of the elements on the same level and reach into the other two zones depending on what feature is used.
