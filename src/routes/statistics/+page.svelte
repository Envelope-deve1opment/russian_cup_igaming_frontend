<script lang="ts">


    import {statisticsService} from "$lib/api/statisticsService";
</script>


{#await statisticsService.getStatistics()}
    <span>Подгружаем статистику...</span>
{:then statistic}
    <div class="stat_stats">
        <div class="stat_stat">
            <span class="stat_title">Собрано у пользователей</span>
            <span class="stat_value">{statistic.totalCollectedAmountTotal}</span>
        </div>
        <div class="stat_stat">
            <span class="stat_title">Выплаты</span>
            <span class="stat_value">{statistic.payoutAmountTotal}</span>
        </div>
        <div class="stat_stat">
            <span class="stat_title">Собрано комиссией</span>
            <span class="stat_value">{statistic.houseCommissionAmountTotal}</span>
        </div>
        <div class="stat_stat">
            <span class="stat_title">Прибыль сервиса</span>
            <span class="stat_value">{statistic.houseProfit}</span>
        </div>
    </div>
{/await}

<style lang="scss">
  .stat_stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.5rem;

    .stat_stat {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      padding: 16px 18px;
      border-radius: 12px;

      background: var(--color-surface);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-card);

      font-family: var(--font-sans);

      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        border-color: var(--color-border-strong);
        box-shadow: var(--shadow-glow);
      }

      .stat_title {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--color-text-muted);
        letter-spacing: 0.02em;
      }

      .stat_value {
        font-family: var(--font-display);
        font-size: 1.9rem;
        font-weight: 800;
        color: var(--color-text);

        display: flex;
        align-items: baseline;
        gap: 0.3rem;

        &::after {
          content: "б.";
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--color-accent);
          opacity: 0.8;
        }
      }

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(
                        120deg,
                        transparent,
                        var(--color-accent-soft),
                        transparent
        );
        opacity: 0;
        transition: opacity 0.25s ease;
      }

      &:hover::before {
        opacity: 1;
      }
    }
  }
</style>
