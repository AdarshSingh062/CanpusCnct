import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Users, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { eventsApi } from '../services/endpoints';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Loader } from '../components/Loader';
import { MODULE_COLORS } from '../utils/moduleColors';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);

  const load = () => eventsApi.get(id).then((res) => setEvent(res.data.data));
  useEffect(() => { load(); }, [id]); // eslint-disable-line

  const handleRegister = async () => {
    setRegistering(true);
    try {
      await eventsApi.register(id);
      toast.success("You're registered!");
      setRegistered(true);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    await eventsApi.cancelRegistration(id);
    toast.success('Registration cancelled');
    setRegistered(false);
    load();
  };

  if (!event) return <Loader />;
  const seatsLeft = Math.max(event.capacity - event.registeredCount, 0);
  const isOwner = event.organizer?._id === user._id;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link to="/events" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[var(--color-navy)]">
        <ArrowLeft size={14} /> Back to events
      </Link>

      {event.banner?.url && <img src={event.banner.url} className="w-full rounded-xl object-cover" alt="" style={{ maxHeight: 260 }} />}

      <Card accentColor={MODULE_COLORS.events}>
        <span className="text-xs font-medium uppercase text-gray-400">{event.category}</span>
        <h1 className="mt-1 font-display text-2xl font-semibold">{event.title}</h1>
        <p className="mt-2 text-sm text-gray-600">{event.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
          <p className="flex items-center gap-2"><Calendar size={15} /> {format(new Date(event.date), 'MMM d, yyyy')}</p>
          <p className="flex items-center gap-2"><Clock size={15} /> {event.time}</p>
          <p className="flex items-center gap-2"><MapPin size={15} /> {event.venue}</p>
          <p className="flex items-center gap-2"><Users size={15} /> {seatsLeft} / {event.capacity} seats left</p>
        </div>

        <div className="mt-5 border-t border-[var(--color-line)] pt-4">
          {isOwner ? (
            <p className="text-sm text-gray-400">You're the organizer of this event.</p>
          ) : registered ? (
            <Button variant="outline" onClick={handleCancel}>Cancel Registration</Button>
          ) : (
            <Button onClick={handleRegister} loading={registering} disabled={seatsLeft === 0}>
              {seatsLeft === 0 ? 'Event Full' : 'Register for Event'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
