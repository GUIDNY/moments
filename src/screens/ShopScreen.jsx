import { AVATARS, PERKS } from '../data/items';
import { formatCoins } from '../engine/economy';
import { useGame } from '../engine/GameContext';
import Button from '../ui/Button';
import GameShell from '../ui/GameShell';

function ItemCard({ item, owned, equipped, coins, onBuy, onEquip }) {
  const affordable = coins >= item.price;
  return (
    <div
      className={`rounded-2xl border p-4 flex items-center gap-4 transition-colors ${
        equipped ? 'border-primary bg-primary/5' : 'border-border/60 bg-surface-container'
      }`}
    >
      <span className="text-4xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-text">{item.name}</h3>
        <p className="text-xs text-text-2">{item.desc}</p>
      </div>
      {owned ? (
        <Button size="sm" variant={equipped ? 'outline' : 'ghost'} onClick={() => onEquip(item.id)}>
          {equipped ? 'מצויד ✓' : 'צייד'}
        </Button>
      ) : (
        <Button size="sm" variant={affordable ? 'gold' : 'outline'} disabled={!affordable} onClick={() => onBuy(item.id)}>
          🪙 {formatCoins(item.price)}
        </Button>
      )}
    </div>
  );
}

export default function ShopScreen({ onExit }) {
  const { state, buyItem, equipItem, pushToast } = useGame();

  const buy = (id) => {
    const res = buyItem(id);
    if (!res.ok && res.reason === 'coins') {
      pushToast({ emoji: '🪙', title: 'אין מספיק מטבעות', sub: 'שחק עוד סיבוב ותחזור' });
    } else if (res.ok) {
      pushToast({ emoji: '🛍️', title: 'הפריט שלך!', sub: 'הוא כבר מצויד' });
    }
  };

  return (
    <GameShell title="החנות" emoji="🛍️" onExit={onExit}>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-xl mx-auto space-y-6">
          <section>
            <h2 className="text-sm font-bold text-text-3 mb-2">דמויות</h2>
            <div className="space-y-2">
              {AVATARS.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  owned={state.ownedItems.includes(item.id)}
                  equipped={state.avatar === item.id}
                  coins={state.coins}
                  onBuy={buy}
                  onEquip={equipItem}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-text-3 mb-2">
              חפצי מזל — מגדילים את התשלום בכל משחקון
            </h2>
            <div className="space-y-2">
              {PERKS.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  owned={state.ownedItems.includes(item.id)}
                  equipped={state.equippedPerk === item.id}
                  coins={state.coins}
                  onBuy={buy}
                  onEquip={equipItem}
                />
              ))}
            </div>
            <p className="text-xs text-text-3 mt-2">אפשר לצייד חפץ מזל אחד בכל פעם.</p>
          </section>
        </div>
      </div>
    </GameShell>
  );
}
