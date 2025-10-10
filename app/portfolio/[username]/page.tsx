import PortfolioView from '../../../components/portfolio/PortfolioView'

export default function PortfolioPage({ params }: { params: { username: string } }) {
  return <PortfolioView username={params.username} />
}