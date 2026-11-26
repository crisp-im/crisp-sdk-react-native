package expo.modules.crispsdk

import im.crisp.sdk.model.MessageContent
import java.net.URL
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Test

class ContentParserTest {
  @Test
  fun `parses text`() {
    assertEquals(MessageContent.TextContent("Hello"), ContentParser.fromMap(mapOf("type" to "text", "text" to "Hello")))
  }

  @Test
  fun `parses file, animation and audio`() {
    val file = ContentParser.fromMap(
      mapOf("type" to "file", "name" to "a.pdf", "mimeType" to "application/pdf", "url" to "https://example.com/a.pdf")
    ) as MessageContent.FileContent
    assertEquals("a.pdf", file.file.name)
    assertEquals(URL("https://example.com/a.pdf"), file.file.url)

    val animation = ContentParser.fromMap(
      mapOf("type" to "animation", "mimeType" to "image/gif", "url" to "https://example.com/a.gif")
    ) as MessageContent.AnimationContent
    assertEquals("image/gif", animation.animationFile.mimeType)

    val audio = ContentParser.fromMap(
      mapOf("type" to "audio", "mimeType" to "audio/mpeg", "url" to "https://example.com/a.mp3", "duration" to 12.0)
    ) as MessageContent.AudioContent
    assertEquals(12, audio.audioFile.duration)
  }

  @Test
  fun `skips picker choices without value or label`() {
    val picker = ContentParser.fromMap(
      mapOf(
        "type" to "picker",
        "id" to "plan",
        "text" to "Which plan?",
        "choices" to listOf(
          mapOf("value" to "pro", "label" to "Pro", "selected" to true),
          mapOf("label" to "No value"),
          mapOf("value" to "no-label")
        )
      )
    ) as MessageContent.PickerContent
    assertEquals(1, picker.picker.choices.size)
    val choice = picker.picker.choices.single()
    assertEquals("pro", choice.value)
    assertEquals("Pro", choice.label)
    assertEquals(true, choice.selected)
  }

  @Test
  fun `parses field without explain`() {
    val field = ContentParser.fromMap(
      mapOf("type" to "field", "id" to "email", "text" to "Your email", "required" to true)
    ) as MessageContent.FieldContent
    assertEquals("email", field.field.id)
    assertEquals("", field.field.explain)
  }

  @Test
  fun `maps carousel targets and skips those without title`() {
    val carousel = ContentParser.fromMap(
      mapOf(
        "type" to "carousel",
        "text" to "Products",
        "targets" to listOf(
          mapOf(
            "title" to "Shoe",
            "description" to "Red",
            "imageUrl" to "https://example.com/shoe.png",
            "actionUrl" to "https://example.com/shoe"
          ),
          mapOf("title" to "Hat"),
          mapOf("description" to "No title")
        )
      )
    ) as MessageContent.CarouselContent
    val (shoe, hat) = carousel.carousel.targets
    assertEquals(2, carousel.carousel.targets.size)
    assertEquals(URL("https://example.com/shoe.png"), shoe.image)
    assertEquals(URL("https://example.com/shoe"), shoe.actions.single().url)
    assertNull(hat.image)
    assertEquals(emptyList<Any>(), hat.actions)
    assertEquals("", hat.description)
  }

  @Test
  fun `rejects unknown types, missing fields and invalid URLs`() {
    assertThrows(IllegalArgumentException::class.java) { ContentParser.fromMap(mapOf("type" to "video")) }
    assertThrows(IllegalArgumentException::class.java) { ContentParser.fromMap(mapOf("type" to "text")) }
    assertThrows(IllegalArgumentException::class.java) {
      ContentParser.fromMap(mapOf("type" to "file", "name" to "a", "mimeType" to "b", "url" to "not a url"))
    }
  }
}
