import { useEffect, useState } from 'react';
import { CircleAlert, MapPin, Plus, Trash2 } from 'lucide-react';
import AddressForm from '../../Components/checkout/AddressForm';
import { addressService } from '../../services/addressService';

function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    addressService.getAddresses()
      .then((result) => {
        if (active) setAddresses(Array.isArray(result) ? result : result?.addresses || result?.data?.addresses || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || requestError?.message || 'Addresses could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function addAddress(values) {
    setSaving(true);
    setError('');
    try {
      const result = await addressService.addAddress(values);
      const created = result?.address || result?.data?.address || result?.data || result;
      setAddresses((current) => [...current, created]);
      setShowForm(false);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Address could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function removeAddress(id) {
    setError('');
    try {
      await addressService.deleteAddress(id);
      setAddresses((current) => current.filter((address) => (address._id || address.id) !== id));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Address could not be removed.');
    }
  }

  async function setDefault(id) {
    setError('');
    try {
      await addressService.setDefault(id);
      setAddresses((current) => current.map((address) => ({ ...address, isDefault: (address._id || address.id) === id })));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Default address could not be updated.');
    }
  }

  return (
    <div className="container store-page">
      <div className="page-heading">
        <div><span className="eyebrow">YOUR APPSICA ACCOUNT</span><h1>Saved addresses</h1><p>Keep your favourite delivery spots close at hand.</p></div>
        {!showForm && <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add address</button>}
      </div>
      {error && <div className="form-alert address-error"><CircleAlert size={17} />{error}</div>}
      {showForm && <section className="address-editor"><div className="address-editor-heading"><h2>New delivery address</h2><button className="remove-link" onClick={() => setShowForm(false)}>Cancel</button></div><AddressForm onSubmit={addAddress} loading={saving} /></section>}
      {loading ? <div className="loading-note">Loading your saved addresses…</div> : addresses.length ? <div className="address-grid">{addresses.map((address) => {
        const id = address._id || address.id;
        return <article className="address-card" key={id}><div className="address-card-top"><span className="address-icon"><MapPin size={18} /></span>{address.isDefault && <span className="badge badge-success">Default</span>}</div><h2>{address.name || address.fullName}</h2><p>{address.address || address.addressLine}<br />{address.city}, {address.state} {address.pincode}</p><span className="address-phone">{address.phone}</span><div className="address-card-actions">{!address.isDefault && <button onClick={() => setDefault(id)}>Set as default</button>}<button className="address-delete" aria-label="Remove address" onClick={() => removeAddress(id)}><Trash2 size={15} /> Remove</button></div></article>;
      })}</div> : !showForm && <div className="empty-state"><div className="empty-state-icon"><MapPin size={28} /></div><h2>No saved addresses yet</h2><p>Add an address to make your next checkout quicker.</p><button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Add your first address</button></div>}
    </div>
  );
}

export default Addresses;