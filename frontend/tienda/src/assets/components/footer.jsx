import { Button } from './ui/button';
import { Separator } from './ui/separator';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Instagram,
    MessageCircle, // WhatsApp
    Facebook,
    Youtube,
    Shield,
    Truck,
    CreditCard,
    Award,
} from 'lucide-react';
import logo from '../img/logo.png';

const socialLinks = [
    {
        name: 'Instagram',
        icon: Instagram,
        href: 'https://www.instagram.com/',
        color: '#E1306C'
    },
    {
        name: 'WhatsApp',
        icon: MessageCircle,
        href: 'https://wa.me/569999999',
        color: '#25D366'
    },
    {
        name: 'Facebook',
        icon: Facebook,
        href: 'https://facebook.com/',
        color: '#1877F3'
    },
  
  
];

const features = [
    {
        icon: Truck,
        title: 'Envío Gratis',
        description: 'En compras sobre $30.000'
    },
    {
        icon: Shield,
        title: 'Compra Segura',
        description: 'Protección SSL 256 bits'
    },
    {
        icon: CreditCard,
        title: 'Múltiples Pagos',
        description: 'Webpay, transferencia y más'
    },
    {
        icon: Award,
        title: 'Calidad Garantizada',
        description: 'Productos certificados'
    }
];

export function Footer() {
    return (
        <footer style={{ background: 'var(--color-life-background)', borderTop: '2px solid #4D648D' }}>
            <Separator />

            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    <div className="lg:col-span-2">
                        <div className="display flex flex-col md:flex-row items-center md:items-start md:justify-between gap-6">
                            {/* Datos y dirección - Centrado en móvil */}
                            <div className="space-y-3 text-center md:text-left">
                                <div className="flex items-center justify-center md:justify-start gap-3" style={{ color: '#283655' }}>
                                    <MapPin className="h-5 w-5 flex-shrink-0" style={{ color: '#4D648D' }} />
                                    <span className="text-sm sm:text-base">AVDA ANTOFAGASTA #1234, ANTOFAGASTA</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-3" style={{ color: '#283655' }}>
                                    <Phone className="h-5 w-5 flex-shrink-0" style={{ color: '#4D648D' }} />
                                    <span className="text-sm sm:text-base">+56 9 99999999</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-3" style={{ color: '#283655' }}>
                                    <Mail className="h-5 w-5 flex-shrink-0" style={{ color: '#4D648D' }} />
                                    <span className="text-sm sm:text-base">contacto@perfumeria.cl</span>
                                </div>
                            </div>
                            
                            {/* Redes sociales - Centrado en móvil */}
                            <div className="flex flex-col items-center md:items-end justify-start mt-0">
                                <h4 className="font-semibold mb-4 text-center md:text-right" style={{ color: '#283655' }}>Nuestras redes</h4>
                                <div className="flex gap-4">
                                    {socialLinks.map((social) => (
                                        <Button
                                            key={social.name}
                                            variant="outline"
                                            size="lg"
                                            className="social-icon-button border-2 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                                            style={{
                                                borderColor: '#4D648D',
                                                color: social.color,
                                                background: '#D0E1F9'
                                            }}
                                            onClick={() => window.open(social.href, '_blank')}
                                        >
                                            <social.icon style={{ color: social.color }} />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />
            <Separator />

            <div style={{ background: '#283655', color: '#D0E1F9' }} className="py-3">
                <div className="container mx-auto px-4 text-center">
                    <p className="display text-sm">
                        Sitio desarrollado por <a href="https://www.weblogica.cl" className="weblogicacl">Weblogica.cl</a>
                    </p>
                </div>
            </div>
        </footer>
    );
}