import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SectionTitle({ title, accent, to }) {
  return (
    <div className="section-heading">
      <h2>
        {title} <span>{accent}</span>
      </h2>
      {to ? (
        <Link className="view-all" to={to}>
          View All <ChevronRight size={15} />
        </Link>
      ) : (
        <button className="view-all">
          View All <ChevronRight size={15} />
        </button>
      )}
    </div>
  );
}
