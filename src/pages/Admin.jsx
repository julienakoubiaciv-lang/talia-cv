/**
 * Admin — Dashboard propriétaire (role: owner | admin)
 *
 * Affiche :
 *   - Stats globales : users total, MRR, coût Anthropic du mois, CV générés
 *   - Tableau users (rôle, tier, CV créés, actions du mois, coût total)
 *   - Tableau usage_events récents (50 derniers appels)
 *   - Override manuel du plan d'un user (upsert subscriptions)
 *
 * Accès : guard via useRole().isStaff — sinon redirect /.
 *
 * Vue SQL utilisée : public.admin_user_stats
 *   (voir supabase/migrations/20260528_profiles_roles_quotas.sql)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useRole } from '@/hooks/useRole';

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg:        '#F7F8FA',
  card:      '#FFFFFF',
  ink:       '#0B1020',
  ink2:      '#3A4156',
  mute:      '#9AA0AE',
  rule:      '#ECEDF1',
  primary:   '#1539B7',
  primarySoft:'#EEF2FF',
  green:     '#15803D',
  greenSoft: '#F0FDF4',
  amber:     '#92400E',
  amberSoft: '#FFFBEB',
  purple:    '#7C3AED',
  purpleSoft:'#F5F3FF',
  red:       '#B91C1C',
  redSoft:   '#FEF2F2',
};

const FONT = "'Manrope', system-ui, sans-serif";

// ── MRR estimé selon tier ──────────────────────────────────────────────────
const TIER_PRICE = { free: 0, personal: 9, business: 29 };

const TIER_COLORS = {
  free:     { bg: C.rule,       fg: C.mute   },
  personal: { bg: C.primarySoft, fg: C.primary },
  business: { bg: C.purpleSoft,  fg: C.purple  },
};

const ROLE_COLORS = {
  owner: { bg: '#FEF3C7', fg: '#92400E' },
  admin: { bg: C.purpleSoft, fg: C.purple },
  user:  { bg: C.rule, fg: C.mute },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtUSD = (n) => '$' + Number(n || 0).toFixed(2);
const fmtNum = (n) => Number(n || 0).toLocaleString('fr-FR');
const fmtDate = (s) => s ? new Date(s).toLocaleString('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
}) : '—';

function Pill({ children, scheme = 'mute', title }) {
  const c = ROLE_COLORS[scheme] || TIER_COLORS[scheme] || { bg: C.rule, fg: C.mute };
  return (
    <span
      title={title}
      style={{
        display: 'inline-block', padding: '2px 9px', borderRadius: 99,
        background: c.bg, color: c.fg,
        fontSize: 11, fontWeight: 700, fontFamily: FONT,
        textTransform: 'capitalize', letterSpacing: '0.02em',
      }}
    >{children}</span>
  );
}

function StatCard({ label, value, suffix, color = C.primary }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: '18px 20px',
      border: '1px solid ' + C.rule, flex: 1, minWidth: 180,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.mute,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.5px' }}>
        {value}{suffix && <span style={{ fontSize: 15, color: C.mute, marginLeft: 4 }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function Admin() {
  const navigate = useNavigate();
  const { isStaff, loading: roleLoading } = useRole();

  const [users, setUsers]   = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [filter, setFilter] = useState(''); // search by email
  const [actingUser, setActingUser] = useState(null); // user en cours de modification

  // ── Guard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roleLoading && !isStaff) navigate('/', { replace: true });
  }, [isStaff, roleLoading, navigate]);

  // ── Fetch initial ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    try {
      const [usersRes, eventsRes] = await Promise.all([
        supabase.from('admin_user_stats')
          .select('*')
          .order('signed_up_at', { ascending: false })
          .limit(200),
        supabase.from('usage_events')
          .select('id, user_id, action, model, input_tokens, cached_tokens, output_tokens, cost_usd, created_at')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);
      if (usersRes.error)  throw new Error('users: '  + usersRes.error.message);
      if (eventsRes.error) throw new Error('events: ' + eventsRes.error.message);
      setUsers(usersRes.data  || []);
      setEvents(eventsRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isStaff) fetchAll();
  }, [isStaff, fetchAll]);

  // ── Override manuel du tier d'un user ─────────────────────────────────────
  const overrideTier = useCallback(async (userId, newTier) => {
    if (!supabase) return;
    setActingUser(userId);
    try {
      const { error } = await supabase.from('subscriptions').upsert({
        user_id: userId,
        tier:    newTier,
        status:  newTier === 'free' ? 'canceled' : 'active',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      await fetchAll();
    } catch (err) {
      alert('Erreur override : ' + err.message);
    } finally {
      setActingUser(null);
    }
  }, [fetchAll]);

  // ── Stats globales calculées ──────────────────────────────────────────────
  const stats = users.reduce((acc, u) => {
    acc.total += 1;
    acc.byTier[u.tier] = (acc.byTier[u.tier] || 0) + 1;
    acc.mrr += TIER_PRICE[u.tier] || 0;
    acc.totalCost += Number(u.total_cost_usd || 0);
    acc.cvsCreated += Number(u.cvs_created || 0);
    return acc;
  }, { total: 0, byTier: {}, mrr: 0, totalCost: 0, cvsCreated: 0 });

  // Coût du mois (sur les usage_events des 30 derniers jours côté events)
  const monthCost = events.reduce((s, e) => s + Number(e.cost_usd || 0), 0);

  // ── Filtre user ───────────────────────────────────────────────────────────
  const filtered = filter
    ? users.filter(u => (u.email || '').toLowerCase().includes(filter.toLowerCase()))
    : users;

  // ── Render ────────────────────────────────────────────────────────────────
  if (roleLoading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display:'flex',
        alignItems:'center', justifyContent:'center', fontFamily: FONT }}>
        <div style={{ color: C.mute }}>Vérification des droits…</div>
      </div>
    );
  }
  if (!isStaff) return null;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT, padding: '32px 28px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>
              🛡️ Admin Dashboard
            </h1>
            <p style={{ fontSize: 13, color: C.mute, margin: '4px 0 0' }}>
              Vue propriétaire — usage, coûts, conversion
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={fetchAll}
              disabled={loading}
              style={{
                padding: '9px 16px', background: C.card, color: C.ink,
                border: '1px solid ' + C.rule, borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                fontFamily: FONT,
              }}
            >
              {loading ? '⟳ Actualisation…' : '↻ Actualiser'}
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '9px 16px', background: C.primary, color: '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              ← Retour app
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: C.redSoft, border: '1px solid #FECACA', color: C.red,
            padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 13,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Stats globales ── */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <StatCard label="Users total"        value={fmtNum(stats.total)} color={C.primary} />
          <StatCard label="MRR estimé"         value={fmtNum(stats.mrr)} suffix="€/mois" color={C.green} />
          <StatCard label="Personnel"          value={fmtNum(stats.byTier.personal || 0)} color={C.primary} />
          <StatCard label="Business"           value={fmtNum(stats.byTier.business || 0)} color={C.purple} />
          <StatCard label="CV générés (total)" value={fmtNum(stats.cvsCreated)} color={C.ink2} />
          <StatCard label="Coût Anthropic"     value={fmtUSD(stats.totalCost)} color={C.amber} />
          <StatCard label="Coût 50 derniers events" value={fmtUSD(monthCost)} color={C.amber} />
        </div>

        {/* ── Tableau users ── */}
        <section style={{ background: C.card, borderRadius: 14, padding: 0, marginBottom: 28, border: '1px solid ' + C.rule, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.rule, display:'flex', justifyContent:'space-between', alignItems:'center', gap: 12, flexWrap:'wrap' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>
              Utilisateurs <span style={{ fontSize: 12, fontWeight: 600, color: C.mute }}>({filtered.length})</span>
            </h2>
            <input
              type="text"
              placeholder="🔍 Filtrer par email…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                padding: '7px 12px', border: '1px solid ' + C.rule, borderRadius: 8,
                fontSize: 12, fontFamily: FONT, minWidth: 240, outline: 'none', color: C.ink,
              }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: C.bg, textAlign: 'left' }}>
                  {['Email', 'Rôle', 'Tier', 'Statut', 'CV créés', 'Actions / mois', 'Coût $', 'Inscrit le', 'Override tier'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid ' + C.rule, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: C.mute }}>Chargement…</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: C.mute }}>Aucun utilisateur</td></tr>
                )}
                {!loading && filtered.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid ' + C.rule }}>
                    <td style={{ padding: '12px 14px', color: C.ink, fontWeight: 600 }}>{u.email || '(sans email)'}</td>
                    <td style={{ padding: '12px 14px' }}><Pill scheme={u.role}>{u.role}</Pill></td>
                    <td style={{ padding: '12px 14px' }}><Pill scheme={u.tier}>{u.tier}</Pill></td>
                    <td style={{ padding: '12px 14px', color: C.ink2 }}>{u.subscription_status || '—'}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(u.cvs_created)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(u.actions_this_month)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: C.amber, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtUSD(u.total_cost_usd)}</td>
                    <td style={{ padding: '12px 14px', color: C.mute, whiteSpace: 'nowrap' }}>{fmtDate(u.signed_up_at)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <select
                        value={u.tier || 'free'}
                        disabled={u.role === 'owner' || actingUser === u.id}
                        onChange={(e) => {
                          if (window.confirm(`Forcer ${u.email} en plan "${e.target.value}" ?`)) {
                            overrideTier(u.id, e.target.value);
                          }
                        }}
                        style={{
                          padding: '5px 8px', border: '1px solid ' + C.rule, borderRadius: 6,
                          fontSize: 11.5, fontFamily: FONT, color: C.ink, background: '#fff',
                          cursor: u.role === 'owner' ? 'not-allowed' : 'pointer',
                          opacity: u.role === 'owner' ? 0.5 : 1,
                        }}
                      >
                        <option value="free">free</option>
                        <option value="personal">personal</option>
                        <option value="business">business</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Tableau events récents ── */}
        <section style={{ background: C.card, borderRadius: 14, border: '1px solid ' + C.rule, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid ' + C.rule }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>
              50 derniers appels Claude
            </h2>
            <p style={{ fontSize: 11.5, color: C.mute, margin: '3px 0 0' }}>
              Live des appels Edge Function claude-proxy
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: C.bg, textAlign: 'left' }}>
                  {['Date', 'Action', 'Modèle', 'Input', 'Cache hit', 'Output', 'Coût $'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: 10.5, fontWeight: 700, color: C.mute, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid ' + C.rule }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: C.mute }}>Aucun appel pour l'instant</td></tr>
                )}
                {events.map(e => {
                  const total = Number(e.input_tokens || 0);
                  const cached = Number(e.cached_tokens || 0);
                  const hitRate = total > 0 ? Math.round((cached / total) * 100) : 0;
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid ' + C.rule }}>
                      <td style={{ padding: '10px 14px', color: C.mute, whiteSpace: 'nowrap' }}>{fmtDate(e.created_at)}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <code style={{ background: C.bg, padding: '2px 7px', borderRadius: 5, fontSize: 11, color: C.ink2 }}>{e.action}</code>
                      </td>
                      <td style={{ padding: '10px 14px', color: C.ink2, fontSize: 11 }}>{e.model || '—'}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(e.input_tokens)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: hitRate > 50 ? C.green : C.mute, fontVariantNumeric: 'tabular-nums', fontWeight: hitRate > 50 ? 700 : 400 }}>
                        {cached > 0 ? `${fmtNum(cached)} (${hitRate}%)` : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: C.ink, fontVariantNumeric: 'tabular-nums' }}>{fmtNum(e.output_tokens)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', color: C.amber, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtUSD(e.cost_usd)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
