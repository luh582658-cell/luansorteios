import { useEffect } from 'react';
import { Shield, MapPin, CheckCircle, Info } from 'lucide-react';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tighter uppercase">
          SOBRE O <span className="text-primary">PROJETO</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base font-medium">
          Conheça mais sobre o Luan Sorteios, nossas políticas e nosso compromisso inabalável com a transparência e a segurança.
        </p>
      </div>

      <div className="glass-card p-8 md:p-12 space-y-10 border-white/5 shadow-2xl">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <MapPin className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Nossas Raízes</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            O <strong>Luan Sorteios</strong> é um projeto orgulhosamente nascido e sediado na cidade de <strong>Reserva/PR</strong>. 
            Nosso objetivo é trazer entretenimento e a chance de realizar sonhos através de sorteios transparentes, 
            acessíveis e totalmente seguros para a nossa população e para todo o Brasil.
          </p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-primary mb-6">
            <Shield className="w-8 h-8" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Segurança e Transparência</h2>
          </div>
          <p className="text-gray-300 leading-relaxed text-sm md:text-base">
            A confiança dos nossos participantes é o nosso maior pilar. Por isso, implementamos as melhores tecnologias de segurança do mercado:
          </p>
          <ul className="space-y-6 mt-6">
            <li className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/10">
              <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <strong className="text-white block mb-1 uppercase tracking-wider text-sm">Pagamentos via Mercado Pago</strong>
                <span className="text-gray-400 text-sm leading-relaxed">Todo o processamento financeiro é feito através do Mercado Pago, garantindo criptografia de ponta a ponta e 100% de segurança nas suas transações PIX. Nós não armazenamos seus dados bancários.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/10">
              <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <strong className="text-white block mb-1 uppercase tracking-wider text-sm">Login Seguro com Google</strong>
                <span className="text-gray-400 text-sm leading-relaxed">Utilizamos a autenticação oficial do Google. Isso significa que você não precisa criar senhas novas que podem ser vazadas. O Google cuida da sua segurança e nós apenas confirmamos sua identidade.</span>
              </div>
            </li>
            <li className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/10">
              <CheckCircle className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <strong className="text-white block mb-1 uppercase tracking-wider text-sm">Sorteios Auditáveis</strong>
                <span className="text-gray-400 text-sm leading-relaxed">Nossos sorteios são baseados em resultados de loterias oficiais ou sistemas de sorteio auditáveis, garantindo que todos tenham exatamente as mesmas chances de ganhar.</span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
