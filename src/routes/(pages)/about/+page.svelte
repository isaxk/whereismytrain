<div class="prose dark:prose-invert">
    <h3>Data sources</h3>
	<p>'Where is my train?' uses data from the following sources:</p>
    <ul>
        <li>
            <a href="https://www.nationalrail.co.uk/">National Rail Enquiries</a>
            (via <a href="https://huxley2.azurewebsites.net">Huxley-2 proxy</a>)
        </li>
        <li>
            <a href="https://github.com/davwheat/uk-railway-stations">@davwheat/uk-railway-stations</a>
        </li>
        <li>
            <a href="https://raildata.org.uk/dataProduct/P-0284e55c-cebe-4736-accf-ac69fde71502/overview">Simplified Tiploc Locations</a>
        </li>
    </ul>
    <p>Note that information cannot be guaranteed to accurate, so please check the information at the station and follow instructions from railway staff.</p>
    <h3>Train location system</h3>
    <p>Train locations are calculated based on 2 factors</p>
    <ul>
        <li>The train's last reported departure from a timing point (TIPLOC)</li>
        <li>An estimation of the train's progress based on expected passing of the next TIPLOC</li>
    </ul>
    <p><b>Please note</b> that the train location system is not designed for safety-critical uses, and the system is purely predictive.</p>
</div>
