import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { del, get, patch, post } from './services/api';

const links: [string, string][] = [
  ['/dashboard', 'Overview'],
  ['/classroom', 'Classroom Locator'],
  ['/workspace', 'Workspace'],
  ['/calendar', 'Academic Calendar'],
  ['/resources', 'Resources & PYQs'],
  ['/requests', 'My Requests'],
  ['/professors', 'Faculty Directory'],
];

function Layout({ children }: { children: any }) {
  const { user, logout } = useAuth();
  return (
    <>
      <div className="mobile-head">TIET-Sync</div>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            TIET-Sync<small>THAPAR ACADEMIC OS</small>
          </div>
          <nav className="nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
            {user?.role === 'FACULTY' && <NavLink to="/faculty/dashboard">Faculty Desk</NavLink>}
            <button className="btn alt" onClick={logout}>Sign out</button>
          </nav>
        </aside>
        <main className="main">{children}</main>
      </div>
    </>
  );
}

function Guard({ children, role }: { children: any; role?: 'STUDENT' | 'FACULTY' }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'FACULTY' ? '/faculty/dashboard' : '/dashboard'} replace />;
  return <Layout>{children}</Layout>;
}

function Auth({ faculty = false, signup = false }: { faculty?: boolean; signup?: boolean }) {
  const { login, setUser } = useAuth();
  const n = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const f = new FormData(e.currentTarget);
    try {
      if (signup) {
        const data = Object.fromEntries(f);
        const x = await post('/auth/register', {
          ...data,
          role: faculty ? 'FACULTY' : 'STUDENT',
          batchYear: Number(data.batchYear) || undefined,
        });
        if (!x.token) {
          alert('Faculty registration submitted. Sign-in is available after approval.');
          n('/auth/professor-login');
          return;
        }
        localStorage.setItem('tiet-token', x.token);
        localStorage.setItem('tiet-user', JSON.stringify(x.user));
        setUser(x.user);
        n('/dashboard');
      } else {
        const u = await login(String(f.get('email')), String(f.get('password')));
        n(u.role === 'FACULTY' ? '/faculty/dashboard' : '/dashboard');
      }
    } catch (x: any) {
      setError(x.response?.data?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth card" onSubmit={submit}>
      <h1>{faculty ? 'Faculty' : 'Student'} {signup ? 'registration' : 'portal'}</h1>
      <p>TIET-Sync Academic OS</p>
      {signup && (
        <>
          <label>Full name</label>
          <input className="input" name="fullName" required />
          <label>{faculty ? 'Faculty ID' : 'Roll number'}</label>
          <input className="input" name={faculty ? 'facultyId' : 'rollNumber'} required />
          {!faculty && (
            <>
              <label>Branch</label>
              <input className="input" name="branch" required />
              <label>Batch year</label>
              <input className="input" type="number" name="batchYear" required />
            </>
          )}
          {faculty && (
            <>
              <label>Department</label>
              <input className="input" name="department" />
              <label>Designation</label>
              <input className="input" name="designation" />
              <label>Cabin location</label>
              <input className="input" name="cabinLocation" />
            </>
          )}
        </>
      )}
      <label>Official email</label>
      <input className="input" name="email" type="email" required />
      <label>Password</label>
      <input className="input" name="password" type="password" minLength={8} required />
      {error && <p className="error">{error}</p>}
      <button className="btn" type="submit" disabled={loading}>
        {loading ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}
      </button>
      <p>
        <a href={signup ? (faculty ? '/auth/professor-login' : '/auth/student-login') : (faculty ? '/auth/professor-signup' : '/auth/student-signup')}>
          {signup ? 'Already have an account? Sign in' : 'New here? Register'}
        </a>
      </p>
      {faculty && signup && (
        <p className="notice">
          Faculty registrations require approval before login. The seeded faculty account is pre-approved for local demonstration.
        </p>
      )}
    </form>
  );
}

function Dashboard() {
  const [d, setD] = useState<any>();
  const [err, setErr] = useState('');
  useEffect(() => {
    get('/dashboard').then(setD).catch(() => setErr('Failed to load dashboard.'));
  }, []);
  if (err) return <p className="error">{err}</p>;
  if (!d) return <p>Loading dashboard…</p>;
  return (
    <>
      <header className="top">
        <div>
          <h1>Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {d.user.fullName}</h1>
          <p>Academic overview and today's priorities</p>
        </div>
      </header>
      <div className="grid3">
        <div className="card muted">
          <b>Attendance</b>
          <div className="kpi">
            {d.attendance.length
              ? Math.round(d.attendance.reduce((s: any, x: any) => s + x.attended / x.total, 0) / d.attendance.length * 100)
              : 0}%
          </div>
          <small>Across enrolled courses</small>
        </div>
        <div className="card">
          <b>Open coursework</b>
          <div className="kpi">{d.assignments.filter((x: any) => !x.completed).length}</div>
          <small>Keep your deadlines in view</small>
        </div>
        <div className="card">
          <b>Upcoming milestones</b>
          <div className="kpi">{d.events.length}</div>
          <small>Academic calendar events</small>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>Assignment checklist</h2>
          <div className="list">
            {d.assignments.map((x: any) => (
              <div className="row" key={x.id}>
                <span>{x.title}<small> · {x.category}</small></span>
                <span>{x.dueDate}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <h2>Academic circulars & events</h2>
          {d.events.map((x: any) => (
            <div className="row" key={x.id}>
              <span>{x.title}<small> · {x.category}</small></span>
              <span>{x.eventDate}</span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function Classroom() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { get('/classrooms', { q }).then(setItems); }, [q]);
  return (
    <>
      <header className="top"><h1>Classroom Locator</h1></header>
      <input className="input" placeholder="Search LT 101, LP 104, CS Lab 3…" value={q} onChange={e => setQ(e.target.value)} />
      <p className="notice">Location information is seeded demonstration data and must be verified on campus.</p>
      <div className="grid">
        {items.map(x => (
          <article className="card" key={x.id}>
            <h2>{x.name} <span className="tag">{x.code}</span></h2>
            <p>{x.building} · {x.floor} · Capacity {x.capacity}</p>
            <p><b>Facilities:</b> {x.amenities}</p>
            <p><b>Directions:</b> {x.directions}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function Workspace() {
  const [as_, setAs] = useState<any[]>([]);
  const [at, setAt] = useState<any[]>([]);
  const load = () => { get('/assignments').then(setAs); get('/attendance').then(setAt); };
  useEffect(load, []);

  const add = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await post('/assignments', { title: f.get('title'), category: f.get('category'), dueDate: f.get('dueDate') });
    e.currentTarget.reset();
    load();
  };

  return (
    <>
      <header className="top"><h1>Academic Workspace</h1></header>
      <div className="grid">
        <section className="card">
          <h2>Coursework</h2>
          <form onSubmit={add}>
            <input className="input" name="title" placeholder="Assignment title" required />
            <select className="input" name="category">
              <option>Coursework</option>
              <option>Lab</option>
            </select>
            <input className="input" type="date" name="dueDate" />
            <button className="btn">Add assignment</button>
          </form>
          {as_.map(x => (
            <div className="row" key={x.id}>
              <span>
                <input type="checkbox" checked={x.completed} onChange={async () => { await patch(`/assignments/${x.id}/complete`); load(); }} />
                {' '}{x.title}
              </span>
              <span>{x.dueDate}</span>
            </div>
          ))}
        </section>
        <section className="card">
          <h2>75% Attendance Monitor</h2>
          {at.map(x => (
            <div className="row" key={x.id}>
              <span>{x.courseCode}<small> {x.attended}/{x.total}</small></span>
              <span>{x.percentage}% {x.additionalClassesRequired > 0 && <em className="error"> · needs {x.additionalClassesRequired} more</em>}</span>
            </div>
          ))}
          <Pomodoro />
        </section>
      </div>
    </>
  );
}

function Pomodoro() {
  const [s, setS] = useState(1500);
  const [on, setOn] = useState(false);
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!on) return;
    const i = setInterval(() => setS(v => {
      if (v <= 1) { setDone(d => d + 1); setOn(false); return 300; }
      return v - 1;
    }), 1000);
    return () => clearInterval(i);
  }, [on]);
  return (
    <div className="notice">
      <b>Pomodoro</b>
      <div className="kpi">{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</div>
      <button className="btn" onClick={() => setOn(!on)}>{on ? 'Pause' : 'Start'}</button>{' '}
      <button className="btn alt" onClick={() => { setOn(false); setS(1500); }}>Reset</button>
      <small> Sessions completed: {done}</small>
    </div>
  );
}

function Calendar() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { get('/calendar').then(setItems); }, []);
  return (
    <>
      <header className="top"><h1>Academic Calendar</h1></header>
      <p className="notice">All dates shown are demonstration data, not official TIET announcements.</p>
      <div className="list">
        {items.map(x => (
          <div className="card row" key={x.id}>
            <span><b>{x.title}</b><small> · {x.category}<br />{x.description}</small></span>
            <span>{x.eventDate}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function Resources() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { get('/resources', { q }).then(setItems); }, [q]);
  return (
    <>
      <header className="top"><h1>Academic Resources & PYQs</h1></header>
      <input className="input" placeholder="Filter by subject or title" value={q} onChange={e => setQ(e.target.value)} />
      <p className="notice">Resource entries are seeded demonstration metadata. External links are not managed by TIET-Sync.</p>
      <div className="grid">
        {items.map(x => (
          <article className="card" key={x.id}>
            <span className="tag">{x.resourceType}</span>
            <h2>{x.title}</h2>
            <p>{x.subject}</p>
            <p>{x.description}</p>
            <a className="btn alt" href={x.externalUrl} target="_blank" rel="noopener noreferrer">Open resource</a>
          </article>
        ))}
      </div>
    </>
  );
}

function Professors() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>();

  useEffect(() => { get('/faculty', { q }).then(setItems); }, [q]);

  const choose = async (x: any) => {
    setSelected(x);
    setSlots(await get(`/faculty/${x.id}/slots`));
  };

  const book = async (id: string) => {
    const description = prompt('Brief reason for consultation:');
    if (description) {
      await post('/consultations', { slotId: id, description });
      alert('Request submitted.');
      if (selected) choose(selected);
    }
  };

  return (
    <>
      <header className="top"><h1>Faculty Directory</h1></header>
      <input className="input" placeholder="Search professor or department" value={q} onChange={e => setQ(e.target.value)} />
      <div className="grid">
        {items.map(x => (
          <article className="card" key={x.id}>
            <h2>{x.fullName}</h2>
            <p>{x.department || 'Department not listed'}<br />{x.cabinLocation || 'Cabin not listed'}</p>
            <button className="btn" onClick={() => choose(x)}>Available slots</button>
          </article>
        ))}
      </div>
      {selected && (
        <section className="card" style={{ marginTop: 18 }}>
          <h2>Book with {selected.fullName}</h2>
          {slots.length ? slots.map(s => (
            <div className="row" key={s.id}>
              <span>{s.date} · {s.startTime}–{s.endTime}</span>
              <button className="btn" onClick={() => book(s.id)}>Request</button>
            </div>
          )) : <p>No available slots.</p>}
        </section>
      )}
    </>
  );
}

function Requests() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const load = () => { get('/consultations').then(setItems); };
  useEffect(() => { load(); }, []);

  const cancelRequest = async (id: string) => {
    if (!confirm('Cancel this consultation request?')) return;
    await patch(`/consultations/${id}/cancel`);
    load();
  };

  return (
    <>
      <header className="top">
        <h1>{user.role === 'FACULTY' ? 'Consultation Desk' : 'My Requests'}</h1>
      </header>
      <div className="list">
        {items.length === 0 && <p className="notice">No consultation requests yet.</p>}
        {items.map(x => (
          <div className="card row" key={x.id}>
            <span>
              <b>{user.role === 'FACULTY' ? x.student : x.faculty}</b>
              <small><br />{x.date} at {x.startTime} · {x.description}</small>
            </span>
            <span>
              <span className="tag">{x.status}</span>
              {user.role === 'FACULTY' && x.status === 'PENDING' && (
                <>
                  {' '}<button className="btn" onClick={async () => { await patch(`/consultations/${x.id}`, { status: 'APPROVED' }); load(); }}>Approve</button>
                  {' '}<button className="btn alt" onClick={async () => { await patch(`/consultations/${x.id}`, { status: 'REJECTED' }); load(); }}>Reject</button>
                </>
              )}
              {user.role === 'STUDENT' && x.status === 'PENDING' && (
                <>
                  {' '}<button className="btn alt" onClick={() => cancelRequest(x.id)}>Cancel</button>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function FacultyDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [mySlots, setMySlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    Promise.all([
      get('/consultations'),
      get(`/faculty/${user.id}/slots`),
    ]).then(([reqs, sl]) => {
      setItems(reqs);
      setMySlots(sl);
      setLoading(false);
    });
  };
  useEffect(() => { loadAll(); }, []);

  const addSlot = async (e: any) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await post('/consultations/slots', {
      date: f.get('date'),
      startTime: f.get('startTime'),
      endTime: f.get('endTime'),
    });
    e.currentTarget.reset();
    loadAll();
  };

  if (loading) return <p>Loading faculty dashboard…</p>;

  return (
    <>
      <header className="top">
        <div>
          <h1>Faculty Dashboard</h1>
          <p>{user.fullName} · {user.cabinLocation || 'Cabin availability not configured'}</p>
        </div>
      </header>
      <div className="grid3">
        <div className="card muted">
          <b>Cabin status</b>
          <div className="kpi">Available</div>
        </div>
        <div className="card">
          <b>Pending consultations</b>
          <div className="kpi">{items.filter(x => x.status === 'PENDING').length}</div>
        </div>
        <div className="card">
          <b>Approved consultations</b>
          <div className="kpi">{items.filter(x => x.status === 'APPROVED').length}</div>
        </div>
      </div>

      <div className="grid" style={{ marginTop: 18 }}>
        <section className="card">
          <h2>Manage consultation slots</h2>
          <form onSubmit={addSlot}>
            <label>Date</label>
            <input className="input" type="date" name="date" required />
            <label>Start time</label>
            <input className="input" type="time" name="startTime" required />
            <label>End time</label>
            <input className="input" type="time" name="endTime" required />
            <button className="btn">Add slot</button>
          </form>
          <h3 style={{ marginTop: 16 }}>Your available slots</h3>
          {mySlots.length === 0 && <p>No available slots.</p>}
          {mySlots.map(s => (
            <div className="row" key={s.id}>
              <span>{s.date} · {s.startTime}–{s.endTime}</span>
            </div>
          ))}
        </section>

        <section className="card">
          <h2>Incoming requests</h2>
          {items.length === 0 && <p>No requests yet.</p>}
          {items.map(x => (
            <div className="row" key={x.id}>
              <span>{x.student} · {x.date} {x.startTime}<small> · {x.description}</small></span>
              <span>
                <span className="tag">{x.status}</span>
                {x.status === 'PENDING' && (
                  <>
                    {' '}<button className="btn" onClick={async () => { await patch(`/consultations/${x.id}`, { status: 'APPROVED' }); loadAll(); }}>Approve</button>
                    {' '}<button className="btn alt" onClick={async () => { await patch(`/consultations/${x.id}`, { status: 'REJECTED' }); loadAll(); }}>Reject</button>
                  </>
                )}
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function Root() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={
          <div className="auth card">
            <h1>TIET-Sync</h1>
            <p>Select your academic portal.</p>
            <a className="btn" href="/auth/student-login">Student portal</a>{' '}
            <a className="btn alt" href="/auth/professor-login">Faculty portal</a>
          </div>
        } />
        <Route path="/auth/student-login" element={<Auth />} />
        <Route path="/auth/student-signup" element={<Auth signup />} />
        <Route path="/auth/professor-login" element={<Auth faculty />} />
        <Route path="/auth/professor-signup" element={<Auth faculty signup />} />
        <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
        <Route path="/classroom" element={<Guard><Classroom /></Guard>} />
        <Route path="/workspace" element={<Guard><Workspace /></Guard>} />
        <Route path="/calendar" element={<Guard><Calendar /></Guard>} />
        <Route path="/resources" element={<Guard><Resources /></Guard>} />
        <Route path="/requests" element={<Guard><Requests /></Guard>} />
        <Route path="/professors" element={<Guard><Professors /></Guard>} />
        <Route path="/faculty/dashboard" element={<Guard role="FACULTY"><FacultyDashboard /></Guard>} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default Root;
