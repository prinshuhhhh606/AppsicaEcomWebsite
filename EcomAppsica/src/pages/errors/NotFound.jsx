import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import EmptyState from '../../Components/common/EmptyState';

export default function NotFound() {
  return (
    <div className="container store-page">
      <EmptyState
        icon={<ShoppingBag size={30} />}
        title="This page wandered off"
        copy="The page you’re looking for isn’t here. Let’s get you back to the good stuff."
        action={
          <Link to="/" className="btn btn-primary">
            Back home <ArrowRight size={17} />
          </Link>
        }
      />
    </div>
  );
}
