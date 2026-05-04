Build a dark-mode-only, fullscreen, node-based generative AI editor in the spirit of Figma + Blender's shader editor +
   ComfyUI. Brand colors: coral #ee7768 (primary), green #a3cf91 (secondary). Background canvas #22252c. Node surface
  #2d3039. Borders and dividers are white/5 to white/10. Fonts: OLIVE Display for headlines, Roboto for body. No light
  mode.

  The editor is a single fullscreen route (/studio/projects/[id]) composed of 5 layout regions stacked over a ReactFlow
  canvas:

  1. Top toolbar (h-12, full width, border-b border-white/5)

  - Left cluster: circular logo button → opens dropdown with Back to Projects, New Project, Rename (editor only), Delete
   project (editor only, red destructive). After a thin w-px h-5 bg-white/10 divider, the project name is shown inline.
  Editors: clickable button revealing a small PenLine pencil icon on hover; click swaps it for an inline <input>
  (autofocus + select-all) with Enter to save / Esc to cancel; auto-saves via PATCH /api/projects/:id. Viewers: plain
  truncated text suffixed with a muted "(View Only)".
  - Right cluster: sync-status pill (only when degraded) — three states with bg-amber-500/10 text-amber-400:
    - save-failed: CloudOff + "Saved locally" + "Sync now" link, optional spinner if auto-retrying.
    - offline: CloudOff + "Offline · Saved locally" + "Reconnect" link with RefreshCw.
    - reconnecting: animated Loader2 + "Reconnecting…".
  Then PresenceAvatars (stacked overlapping circular avatars of co-editors via Yjs/PartyKit), a divider, and a coral
  Share button (bg-primary/10 hover:bg-primary/20) that opens a modal.

  2. Left rail (w-14, vertical icon column, border-r border-white/5)

  Icon-only buttons, 40×40 rounded-lg, muted white/40 → white/60 on hover, white/10 + white when active, with a 2×20
  coral indicator bar on the active item's left edge. Tooltips appear as small dark pills 2px to the right of the icon
  on hover.

  Order top-to-bottom (editor only — viewers see the rail empty except the bottom cluster):
  1. Search — toggles the search variant of the flyout panel.
  2. LayoutGrid (Gallery) — opens the asset gallery panel.
  3. Clock (Used in Project) — scrolls the node palette to the recently used section.
  4. thin divider w-6 h-px bg-white/5.
  5. Category anchors that both open the palette and scroll-spy to a section: Type (Input), ImagePlus (2D), Box (3D),
  Film (Video). Active state mirrors scroll position.
  6. Spacer pushes bottom cluster down: HelpCircle (Shortcuts dialog), Mail (Contact dialog).

  Clicking an already-active category collapses the flyout. Switching from Gallery → category re-routes through the
  nodes flyout.

  3. Left flyout panel (w-64, absolute left-14, slide-in slide-in-from-left-2)

  Conditionally rendered based on leftRailSection ∈ {nodes, search, gallery, null}.

  Nodes / Search variant:
  - Top: search input with leading magnifier and trailing clear X, bg-white/5 border-white/10 rounded-md. Focuses
  automatically on Search mode and on Cmd+F.
  - Body: a vertical scroll list (no-scrollbar) of category sections. Each section is an aspect-square grid of
  NodeCards: icon tinted with the node's output port color, label below in text-[11px] text-white/60, draggable with a
  grab cursor; comingSoon cards render at 40% opacity with a tiny rounded "Soon" pill.
  - Esc closes the panel; closing input first blurs.

  Gallery variant: thumbnails of media generated in this workspace, also draggable onto canvas.

  4. Right contextual panel (w-72, border-l, slide-in from right)

  Auto-shows when there is content; auto-hides otherwise. User can force-hide with the header X. State resets when
  interaction mode or selected node changes. Two modes:
  - Properties (when exactly one node is selected and not in comment mode): renders advanced parameters for that node —
  model picker, sliders, dropdowns, prompt fields — on a vertical scroll with custom-scrollbar.
  - Comments (when interactionMode === "comment"): thread list, mention input, resolved toggles.
  Header: small uppercase tracking-wider text-white/40 label "PROPERTIES" / "COMMENTS" + close X.

  5. Floating bottom toolbar (fixed bottom-4 left-1/2 -translate-x-1/2 z-40)

  Pill bar bg-[#2d3039]/90 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl. 32×32 icon buttons with hover
  tooltips (label + <kbd> shortcut chip) and a 12×2 coral underline indicator on the active mode. Groups separated by
  w-px h-5 bg-white/10 dividers:
  1. Interaction modes: MousePointer Select (V), Hand Hand (H), MessageCircle Comment (C).
  2. Zoom: ZoomOut (–), Maximize Fit View (⌘.), ZoomIn (+).
  3. Editor-only: LayoutDashboard Arrange Nodes (⇧A) — auto-layout + animated fitView.
  4. Editor-only: Search Add Node (⇧Space) — fires editor:open-command-palette.

  6. The ReactFlow canvas itself

  - min-zoom 0.1, max-zoom 3, zoomOnDoubleClick={false} (double-click is repurposed).
  - Background: BackgroundVariant.Dots color #4d5263, gap 24, size 2.
  - MiniMap (bottom-right): custom node renderer — rounded rect filled #2d3039 with a 3px top accent stroke colored by
  the node's primary port type; selected nodes get a full outline. Mask rgba(34,37,44,0.85).
  - Pan / select behavior depends on mode:
    - Hand mode (or Space held, or middle-mouse held): panOnDrag=[0,1], nodes not draggable, elements not selectable,
  edges not reconnectable, cursor reflects panning.
    - Select mode: panOnDrag=[1] (right-click drag pans), selectionOnDrag for box selection, left-drag = box-select.
  - Spacebar momentarily switches to Hand and restores on keyup; same for middle-click (with auxclick preventDefault to
  kill the OS auto-scroll cursor).
  - panOnScroll is on (trackpad-style two-finger pan). Wheel zoom uses default ReactFlow.
  - Empty state: when canvas is loaded and has zero nodes (and user is editor), render a full-canvas Template Gallery
  overlay with curated starter templates and a "Start blank" CTA that injects a starter node centered + fitView.
  - Loading state: absolute full-cover #22252c panel with a centered LycheeLoader (size 72) until Yjs canvas hydration
  completes.
  - Cursor layer: sibling overlay rendering remote collaborators' cursors with name labels (PostHog-style), throttled to
   20 fps from mousemove.
  - Remote selection layer: translucent colored outlines around nodes other users are currently selecting.
  - Canvas comments layer: pin avatars rendered at flow coordinates. In Comment mode, clicking the canvas drops a new
  pin and opens the thread popover.

  7. Nodes (BaseNode template)

  Every node is w-[280px] rounded-xl bg-[#2d3039] shadow-xl, wrapped in memo(). The node has an accent color derived
  from its first output port type (e.g., images = one color, 3D = another, video = another, text = another). The accent
  shows as:
  - A 3px top border in the accent color.
  - All other borders white/10, but when selected they become the accent color and a 0 0 20px color-mix(... 19%) glow
  ring is added.
  - Header (px-3 py-2.5 border-b border-white/5 bg-white/[0.02]): square 24×24 icon tile filled with color-mix(accent
  12%) and the icon in accent color; title text-xs text-white/70 font-medium; optional provider sublabel text-[9px]
  text-white/30 (e.g., "Gemini", "Tripo3D").
  - Body: per-node UI (text prompt, image preview, 3D viewer, sliders, dropdowns). Interactive elements must carry
  nodrag and nowheel classes so ReactFlow doesn't hijack input.

  Ports (handles):
  - Left side = inputs (target), right side = outputs (source). Vertically distributed evenly using (index+1)/(count+1)
  * 100%.
  - Each port is a colored dot (color = port type). Hovering or clicking the port reveals a "+" affordance and opens a
  port menu popup listing compatible node types — picking one creates the new node and draws the connection
  automatically using addNodeAndConnect(). Position of the new node is computed by calculateNewNodePosition() to avoid
  overlap.
  - Drag from a port = standard wire creation; isValidConnection filters by port type compatibility.

  Edges (wires): custom ColoredEdge, bezier path, color = source port type. Selected edges are 2.5px and full opacity;
  idle edges are 1.5px @ 75% opacity. While the source node's data.status is "generating", an additional animated
  overlay path (.edge-generating CSS animation) flows along the wire to telegraph live data flow.

  8. Discovery surfaces for adding nodes

  Three coexisting paths to add a node, all funneling through addNode(type, position):
  1. Drag a NodeCard from the left flyout onto the canvas — drop position is converted via screenToFlowPosition.
  2. Right-click empty canvas → CanvasContextMenu (categorized list at cursor).
  3. Double-click empty canvas, ⇧Space, or the bottom toolbar Add Node button → centered NodeCommandPalette (fuzzy
  search). Position falls back to viewport center + small jitter when triggered by keyboard.

  A starter type from the URL (?starter=...&tpl=...) auto-creates one node centered + animated fitView, then strips the
  query params via history.replaceState.

  9. Keyboard model

  Global shortcuts (all blocked when an input/textarea/contentEditable is focused):
  - V Select, H Hand, C Comment, Space (hold) temporary Hand.
  - Cmd/Ctrl+Z undo (toast warning if a generation is mid-flight), Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y redo.
  - Cmd/Ctrl+C/V/D/A copy / paste / duplicate / select-all (paste & duplicate land at viewport center).
  - Cmd/Ctrl+. fitView, Cmd/Ctrl+Enter run generation on selected node.
  - + / - zoom in/out.
  - ⇧A arrange nodes (auto-layout) + fitView.
  - ⇧Space open command palette.
  - Cmd/Ctrl+F from anywhere → opens Search flyout and focuses the field.
  - Esc closes flyouts / blurs inputs / dismisses menus.
  All shortcuts are remappable via usePreferencesStore and the Shortcuts dialog displays current bindings.

  10. Status, presence & autosave UX

  - Sync-status pill in the toolbar communicates Yjs/PartyKit connection (offline / reconnecting / save-failed /
  connected).
  - Presence avatars in toolbar reflect live editors.
  - Beforeunload guard: if isDirty && syncStatus !== "connected", browser prompts to confirm leave.
  - Thumbnail capture: 1s after first load if missing; otherwise a 5s debounce with a 30s cooldown driven by
  isLocalDirty. Upload is fire-and-forget so navigation doesn't cancel it.
  - Toasts: "Can't undo while generation is running", template applied banner ("This is a copy of …"), share/sync
  errors.

  - Esc closes flyouts / blurs inputs / dismisses menus.
  All shortcuts are remappable via usePreferencesStore and the Shortcuts dialog displays current bindings.

  10. Status, presence & autosave UX

  - Sync-status pill in the toolbar communicates Yjs/PartyKit connection (offline / reconnecting / save-failed / connected).
  - Presence avatars in toolbar reflect live editors.
  - Beforeunload guard: if isDirty && syncStatus !== "connected", browser prompts to confirm leave.
  - Thumbnail capture: 1s after first load if missing; otherwise a 5s debounce with a 30s cooldown driven by isLocalDirty. Upload is fire-and-forget so
  navigation doesn't cancel it.
  - Toasts: "Can't undo while generation is running", template applied banner ("This is a copy of …"), share/sync errors.

  11. Role gating

  - viewer role: empty left rail (no node creation), no drag-drop, no right-click menu, no double-click palette, no delete keys, no Share button, no
  Properties/Comments edits — pan/zoom + read-only inspection only.
  - editor: full toolset.
  - creator: same as editor + "Manage members" inside the Share modal.

  12. Motion & feel

  - All hovers transition colors 100–150ms.
  - Panels slide in with animate-in slide-in-from-{left,right}-2 duration-150.
  - Edge animation while generating uses a dashed-flow stroke-dashoffset keyframe.
  - Selection glow on nodes is a soft accent-tinted ring, not a hard outline.
  - MiniMap and ports use the same per-port-type color palette (single source of truth: PORT_COLOR_VARS) so the entire canvas is color-coded by data type at
   a glance.

  The design language: calm, deeply muted neutrals with surgical pops of port-type color. Chrome stays out of the way; the canvas is the hero. Every primary
   action has a keyboard path, a button path, and a context-menu path