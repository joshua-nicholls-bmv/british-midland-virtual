(() => {
    'use strict';
    const endpoint = 'https://eqbaezhcwnjlcnvtfxho.supabase.co/rest/v1/public_website_events';
    const publicKey = 'sb_publishable__JTXMIQDaruQdmjEmf9t6w_T23MXelW';
    const fields = 'id,title,description,starts_at,departure,arrival,aircraft,organiser,cancelled';
    const list = document.getElementById('events-list');
    const message = document.getElementById('events-status');
    const retry = document.getElementById('events-retry');
    const more = document.getElementById('events-more');
    const heading = document.getElementById('upcoming-title');
    const buttons = [...document.querySelectorAll('[data-events-view]')];
    const date = new Intl.DateTimeFormat('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit', hourCycle:'h23', timeZone:'UTC' });
    const organisers = { BM:'British Midland', BMG:'British Midland Group', ECV:'European Cargo Virtual' };
    let events = [], view = 'upcoming', limit = 12, loading = false, loaded = false;
    function element(tag, className, text) {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (text !== undefined) el.textContent = text;
        return el;
    }
    function card(event) {
        const article = element('article', 'event-card');
        const top = element('div', 'event-card-top');
        top.append(element('span', 'event-organiser', organisers[event.organiser] || 'Community event'));
        if (event.cancelled) top.append(element('span', 'event-cancelled', 'Cancelled'));
        else if (view === 'past') top.append(element('span', 'event-past', 'Past event'));
        article.append(top, element('h3', '', event.title));
        const time = element('time', 'event-time', date.format(new Date(event.starts_at)) + ' UTC');
        time.dateTime = event.starts_at;
        article.append(time);
        if (event.departure || event.arrival) article.append(element('p', 'event-route', `${event.departure || 'To be confirmed'} → ${event.arrival || 'To be confirmed'}`));
        if (event.aircraft) article.append(element('p', 'event-aircraft', `Aircraft: ${event.aircraft}`));
        if (event.description) {
            const details = element('details', 'event-details');
            details.append(element('summary', '', 'Event details'), element('p', 'event-description', event.description));
            article.append(details);
        }
        if (!event.cancelled && view === 'upcoming') {
            const join = element('a', 'event-join', 'Join in ACARS');
            join.href = '#joining-in-acars';
            article.append(join);
        }
        return article;
    }
    function render() {
        if (!loaded) return;
        const now = Date.now();
        const selected = events.filter(e => view === 'upcoming' ? Date.parse(e.starts_at) >= now : Date.parse(e.starts_at) < now)
            .sort((a,b) => (Date.parse(a.starts_at)-Date.parse(b.starts_at)) * (view === 'past' ? -1 : 1) || a.id.localeCompare(b.id));
        list.replaceChildren();
        for (const event of selected.slice(0,limit)) list.append(card(event));
        if (!selected.length) {
            const empty = element('div', 'events-empty');
            empty.append(element('h3','',view === 'past' ? 'Our event archive starts here.' : 'Our next event is on the horizon.'),
                element('p','',view === 'past' ? 'Past events published on the website will appear here.' : 'No upcoming events have been published here yet. Check back for our next community flight.'));
            list.append(empty);
        }
        heading.textContent = view === 'past' ? 'Past events archive' : 'Upcoming events';
        more.hidden = selected.length <= limit;
        message.textContent = `${selected.length} ${view === 'past' ? 'past' : 'upcoming'} ${selected.length === 1 ? 'event' : 'events'} · updates every minute`;
        buttons.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.eventsView === view)));
    }
    async function load() {
        if (loading) return;
        loading = true;
        retry.hidden = true;
        if (!loaded) message.textContent = 'Loading events…';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(),15000);
        try {
            const fresh = [];
            while (true) {
                const url = new URL(endpoint);
                url.search = new URLSearchParams({select:fields, order:'starts_at.asc,id.asc',limit:'200',offset:String(fresh.length)});
                const response = await fetch(url,{headers:{apikey:publicKey},credentials:'omit',cache:'no-store',signal:controller.signal});
                if (!response.ok) throw new Error('Events unavailable');
                const page = await response.json();
                if (!Array.isArray(page)) throw new Error('Unexpected response');
                if (!page.length) break;
                fresh.push(...page);
            }
            events = fresh.filter(e => typeof e.id === 'string' && Number.isFinite(Date.parse(e.starts_at)));
            loaded = true;
            render();
        } catch {
            // Do not keep displaying an event which management may have hidden.
            events = []; loaded = false; list.replaceChildren(); more.hidden = true;
            message.textContent = 'Events are temporarily unavailable. Please try again.';
            retry.hidden = false;
        } finally { clearTimeout(timeout); loading = false; }
    }
    buttons.forEach(b => b.addEventListener('click',() => {view=b.dataset.eventsView;limit=12;render();}));
    more.addEventListener('click',() => {limit+=12;render();});
    retry.addEventListener('click',load);
    setInterval(() => {if (!document.hidden) load();},60000);
    document.addEventListener('visibilitychange',() => {if (!document.hidden) load();});
    load();
})();
