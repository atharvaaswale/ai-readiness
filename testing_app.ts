
const PSI_API_KEY = "AIzaSyDbnekA214zYb66ZFb-5IRYimgrfI-AsEk"//process.env.GOOGLE_PSI_API_KEY;
const TEST_URL = 'https://www.cococusto.com/'; 

async function testPageSpeedInsights() {
  if (!PSI_API_KEY) {
    console.error('❌ Error: GOOGLE_PSI_API_KEY is missing in .env.local');
    process.exit(1);
  }

  console.log(`🚀 Initiating PageSpeed Insights analysis for: ${TEST_URL}...`);
  
  // Construct the Google API target parameters
  const targetApiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  targetApiUrl.searchParams.append('url', TEST_URL);
  targetApiUrl.searchParams.append('key', PSI_API_KEY);
  targetApiUrl.searchParams.append('strategy', 'mobile');

  try {
    // const response = await fetch(targetApiUrl.toString(), { method: 'GET' });
    const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds limit

const response = await fetch(targetApiUrl.toString(), { 
  method: 'GET',
  signal: controller.signal
});
clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    const lhResult = data.lighthouseResult;

    if (!lhResult) {
      throw new Error('Malformed response: Missing lighthouseResult object.');
    }

    // Process metric scores according to task specs
    const rawPerformanceScore = lhResult.categories?.performance?.score ?? 0;
    const cwvScore = Math.round(rawPerformanceScore * 100); // Scale 0.0-1.0 up to 0-100
    
    const lcp = lhResult.audits?.['largest-contentful-paint']?.displayValue ?? 'N/A';
    const cls = lhResult.audits?.['cumulative-layout-shift']?.displayValue ?? 'N/A';
    const tbt = lhResult.audits?.['total-blocking-time']?.displayValue ?? 'N/A';

    // Print out clean terminal results
    console.log('\n=========================================');
    console.log('📊 PAGESPEED INSIGHTS TEST RESULTS');
    console.log('=========================================');
    console.log(`Target URL:     ${TEST_URL}`);
    console.log(`CWV Core Score: ${cwvScore} / 100`);
    console.log(`LCP Value:      ${lcp}`);
    console.log(`CLS Value:      ${cls}`);
    console.log(`TBT Value:      ${tbt}`);
    console.log('=========================================\n');

  } catch (error) {
    console.error('❌ PageSpeed Test Execution Failed:', error);
  }
}

testPageSpeedInsights();