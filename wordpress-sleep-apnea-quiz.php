<?php
/**
 * Plugin Name: Wordpress Sleep Apnea Quiz
 * Plugin URI: https://goweb.pl
 * Description: Krokowy quiz oceny ryzyka bezdechu sennego oparty o metodologię STOP-BANG.
 * Version: 1.0.0
 * Author: goweb.pl
 * Author URI: https://goweb.pl
 * Text Domain: wordpress-sleep-apnea-quiz
 */

if (! defined('ABSPATH')) {
	exit;
}

final class Wordpress_Sleep_Apnea_Quiz {
	private const VERSION = '1.0.0';
	private const SHORTCODE = 'sleep_apnea_quiz';

	public function __construct() {
		add_action('wp_enqueue_scripts', array($this, 'register_assets'));
		add_shortcode(self::SHORTCODE, array($this, 'render_quiz_shortcode'));
	}

	public function register_assets(): void {
		$style_path  = plugin_dir_path(__FILE__) . 'assets/css/quiz.css';
		$script_path = plugin_dir_path(__FILE__) . 'assets/js/quiz.js';

		wp_register_style(
			'wsaq-quiz',
			plugin_dir_url(__FILE__) . 'assets/css/quiz.css',
			array(),
			file_exists($style_path) ? (string) filemtime($style_path) : self::VERSION
		);

		wp_register_script(
			'wsaq-quiz',
			plugin_dir_url(__FILE__) . 'assets/js/quiz.js',
			array(),
			file_exists($script_path) ? (string) filemtime($script_path) : self::VERSION,
			true
		);
	}

	public function render_quiz_shortcode(array $atts = array()): string {
		wp_enqueue_style('wsaq-quiz');
		wp_enqueue_script('wsaq-quiz');

		$quiz_id   = wp_unique_id('wsaq-');
		$questions = $this->get_questions();
		$config    = array(
			'quizId'         => $quiz_id,
			'ctaUrl'         => '/sklep/',
			'ctaLabel'       => 'Wykonaj badanie',
			'questions'      => $questions,
			'labels'         => array(
				'yes'            => 'Tak',
				'no'             => 'Nie',
				'next'           => 'Dalej',
				'back'           => 'Wstecz',
				'checkResult'    => 'Sprawdź wynik',
				'startAgain'     => 'Wypełnij ponownie',
				'progressLabel'  => 'Postęp',
				'progressStep'   => 'Krok',
				'summaryTitle'   => 'Podsumowanie odpowiedzi',
				'completionKick' => 'Kwestionariusz został uzupełniony. Sprawdź wynik, aby zobaczyć interpretację.',
				'questionTag'    => 'Pytanie',
			),
			'messages'       => array(
				'low'      => 'Wynik wskazuje na niskie ryzyko obturacyjnego bezdechu sennego.',
				'moderate' => 'Wynik wskazuje na umiarkowane ryzyko bezdechu sennego. Warto rozważyć dalszą diagnostykę.',
				'high'     => 'Wynik wskazuje na wysokie ryzyko bezdechu sennego. Zalecane jest wykonanie badania i konsultacja ze specjalistą.',
			),
			'riskLabels'     => array(
				'low'      => 'Niskie ryzyko',
				'moderate' => 'Umiarkowane ryzyko',
				'high'     => 'Wysokie ryzyko',
			),
		);

		ob_start();
		?>
		<section class="wsaq-shell">
			<div
				id="<?php echo esc_attr($quiz_id); ?>"
				class="wsaq"
				data-config="<?php echo esc_attr(wp_json_encode($config)); ?>"
			>
				<div class="wsaq__backdrop" aria-hidden="true"></div>
				<div class="wsaq__card">
					<div
						class="wsaq__top-progress"
						role="progressbar"
						aria-label="Postęp quizu"
						aria-valuemin="0"
						aria-valuemax="<?php echo esc_attr((string) count($questions)); ?>"
						aria-valuenow="0"
						>
							<div class="wsaq__top-progress-fill"></div>
							<div class="wsaq__top-progress-steps">
								<?php foreach ($questions as $index => $question) : ?>
									<button
										type="button"
										class="wsaq__progress-step<?php echo 0 === $index ? ' is-current' : ''; ?>"
										data-step="<?php echo esc_attr((string) $index); ?>"
										aria-label="<?php echo esc_attr(sprintf('Przejdź do kroku %d', $index + 1)); ?>"
									>
										<?php echo esc_html((string) ($index + 1)); ?>
									</button>
								<?php endforeach; ?>
							</div>
						</div>

					<div class="wsaq__content">
						<header class="wsaq__header">
							<div class="wsaq__heading">
								<h2 class="wsaq__title">Oceń ryzyko bezdechu sennego</h2>
								<p class="wsaq__subtitle">Wypełnij krótki kwestionariusz</p>
								<p class="wsaq__progress-text">Krok 1 z <?php echo esc_html((string) count($questions)); ?></p>
							</div>
						</header>

						<div class="wsaq__flow">
							<div class="wsaq__body">
								<div class="wsaq__question-stage" aria-live="polite"></div>
								<aside class="wsaq__answers" aria-live="polite"></aside>
							</div>

							<div class="wsaq__actions">
								<button type="button" class="wsaq__ghost-button" data-action="back" hidden>Wstecz</button>
								<button type="button" class="wsaq__primary-button" data-action="next" hidden>Dalej</button>
							</div>
						</div>

						<div class="wsaq__result" hidden></div>
					</div>
				</div>
			</div>
		</section>
		<?php

		return (string) ob_get_clean();
	}

	private function get_questions(): array {
		return array(
			array(
				'id'       => 'snoring',
				'headline' => 'Chrapanie',
				'text'     => 'Czy chrapią Państwo głośno (na tyle głośno, że słychać przez zamknięte drzwi lub partner/ka szturcha w nocy z powodu chrapania)?',
			),
			array(
				'id'       => 'fatigue',
				'headline' => 'Zmęczenie',
				'text'     => 'Czy często czują się Państwo zmęczeni po nocy, wyczerpani lub śpiący w ciągu dnia (np. zasypianie podczas prowadzenia pojazdu)?',
			),
			array(
				'id'       => 'observed',
				'headline' => 'Spostrzeżenia innych',
				'text'     => 'Czy ktoś zauważył, że przestawali Państwo oddychać podczas snu lub dusili/krztusili się w nocy?',
			),
			array(
				'id'       => 'pressure',
				'headline' => 'Ciśnienie',
				'text'     => 'Czy mają Państwo rozpoznane nadciśnienie tętnicze i przyjmują z tego powodu leki?',
			),
			array(
				'id'       => 'bmi',
				'headline' => 'BMI',
				'text'     => 'Czy Państwa wskaźnik masy ciała (BMI) wynosi powyżej 35 kg/m²?',
			),
			array(
				'id'       => 'age',
				'headline' => 'Wiek',
				'text'     => 'Czy mają Państwo więcej niż 50 lat?',
			),
			array(
				'id'       => 'neck',
				'headline' => 'Obwód szyi',
				'text'     => 'Czy Państwa rozmiar kołnierzyka to 43 cm lub więcej (mężczyźni) albo 41 cm lub więcej (kobiety)?',
			),
			array(
				'id'       => 'gender',
				'headline' => 'Płeć',
				'text'     => 'Czy osoba badana jest mężczyzną?',
			),
		);
	}

}

new Wordpress_Sleep_Apnea_Quiz();
