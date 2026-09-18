{/* Live list of shipping destinations, fetched from the production API so the
    docs never go stale when countries are toggled in /admin/countries. Falls
    back to the old static sentence if the fetch fails (offline, CORS, etc.). */}

export const SupportedShippingCountries = () => {
  const [countries, setCountries] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch('https://catchbackcards.com/api/shipping-countries')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        Array.isArray(d.countries) && d.countries.length > 0
          ? setCountries(d.countries)
          : setFailed(true)
      )
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <p>
        The checkout address form shows you the currently supported destination
        countries.
      </p>
    );
  }
  if (!countries) {
    return <p>Loading the current list of supported countries…</p>;
  }

  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const flag = (iso) =>
    iso.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  const rest = countries
    .filter((c) => c !== 'US')
    .sort((a, b) => (names.of(a) || a).localeCompare(names.of(b) || b));
  const sorted = countries.includes('US') ? ['US', ...rest] : rest;

  return (
    <>
      <p>
        We currently ship to <strong>{sorted.length} countries</strong> (this
        list is live — it always reflects today's supported destinations):
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {sorted.map((iso) => (
          <span
            key={iso}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(128,128,128,0.35)',
              fontSize: '14px',
              lineHeight: '20px',
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">{flag(iso)}</span>
            {names.of(iso) || iso}
          </span>
        ))}
      </div>
    </>
  );
};
