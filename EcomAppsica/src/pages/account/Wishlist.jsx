import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { WishlistContext } from '../../context/WishlistContextValue';
import ProductGrid from '../../Components/product/ProductGrid';
import PageHeading from '../../Components/common/PageHeading';
import EmptyState from '../../Components/common/EmptyState';

export default function Wishlist() {
  const { wishlist } = useContext(WishlistContext);

  return (
    <div className="container store-page">
      <PageHeading eyebrow="SAVED FOR LATER" title="Your wishlist">
        All the things you’ve had your eye on, together in one place.
      </PageHeading>

      {wishlist.length ? (
        <ProductGrid products={wishlist} />
      ) : (
        <EmptyState
          icon={<Heart size={29} />}
          title="Your wishlist is waiting"
          copy="Tap the heart on anything you love and it’ll show up here."
          action={
            <Link to="/products" className="btn btn-primary">
              Find your favourites <ArrowRight size={17} />
            </Link>
          }
        />
      )}
    </div>
  );
}
